import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const segments = (await params).path;
    const cleanPath = segments.join('/');
    
    // Resolve full file path relative to local storage root
    const storageRoot = path.join(process.cwd(), 'storage');
    const resolvedPath = path.resolve(storageRoot, cleanPath);

    // Security Check: Prevent directory traversal escape
    if (!resolvedPath.startsWith(storageRoot)) {
      return new Response('Access Denied', { status: 403 });
    }

    if (!fs.existsSync(resolvedPath)) {
      return new Response('File Not Found', { status: 404 });
    }

    const fileBuffer = await fs.promises.readFile(resolvedPath);
    
    // Detect content type
    let contentType = 'application/octet-stream';
    if (resolvedPath.endsWith('.png')) {
      contentType = 'image/png';
    } else if (resolvedPath.endsWith('.jpg') || resolvedPath.endsWith('.jpeg')) {
      contentType = 'image/jpeg';
    } else if (resolvedPath.endsWith('.pdf')) {
      contentType = 'application/pdf';
    }

    return new Response(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400'
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

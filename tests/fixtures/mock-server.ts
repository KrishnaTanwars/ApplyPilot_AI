import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = 3001;

const server = http.createServer((req, res) => {
  const url = req.url || '';
  const method = req.method || 'GET';

  if (method === 'POST') {
    // Return standard success redirect or page text
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <html>
        <head><title>Success</title></head>
        <body style="background:#09090b; color:#f4f4f5; font-family:sans-serif; text-align:center; padding-top:100px;">
          <h1 style="color:#22c55e;">Submission Successful!</h1>
          <p>Thank you! Your application has been successfully submitted.</p>
        </body>
      </html>
    `);
    return;
  }

  // Greenhouse Mock Form
  if (url === '/greenhouse') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <html>
        <head><title>Careers - Greenhouse Mock</title></head>
        <body style="background:#09090b; color:#f4f4f5; font-family:sans-serif; max-width:500px; margin:50px auto; padding:20px; border:1px solid #27272a; border-radius:12px;">
          <h2>Apply for Software Engineer Role</h2>
          <form id="application_form" action="/submit" method="POST" enctype="multipart/form-data">
            <div style="margin-bottom:12px;">
              <label for="first_name">First Name *</label><br/>
              <input type="text" id="first_name" name="job_application[first_name]" required style="background:#18181b; border:1px solid #27272a; color:#fff; padding:8px; width:100%; border-radius:6px;"/>
            </div>
            <div style="margin-bottom:12px;">
              <label for="last_name">Last Name *</label><br/>
              <input type="text" id="last_name" name="job_application[last_name]" required style="background:#18181b; border:1px solid #27272a; color:#fff; padding:8px; width:100%; border-radius:6px;"/>
            </div>
            <div style="margin-bottom:12px;">
              <label for="email">Email *</label><br/>
              <input type="email" id="email" name="job_application[email]" required style="background:#18181b; border:1px solid #27272a; color:#fff; padding:8px; width:100%; border-radius:6px;"/>
            </div>
            <div style="margin-bottom:12px;">
              <label for="phone">Phone *</label><br/>
              <input type="text" id="phone" name="job_application[phone]" required style="background:#18181b; border:1px solid #27272a; color:#fff; padding:8px; width:100%; border-radius:6px;"/>
            </div>
            <div style="margin-bottom:12px;">
              <label for="resume">Resume / CV *</label><br/>
              <input type="file" id="resume" name="job_application[resume]" required style="color:#ccc;"/>
            </div>
            <div style="margin-top:20px;">
              <button type="submit" id="submit_app" style="background:#4f46e5; border:none; color:#fff; padding:10px 20px; font-weight:bold; cursor:pointer; border-radius:6px; width:100%;">
                Submit Application
              </button>
            </div>
          </form>
        </body>
      </html>
    `);
    return;
  }

  // Lever Mock Form
  if (url === '/lever') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <html>
        <head><title>Lever Mock Application</title></head>
        <body style="background:#09090b; color:#f4f4f5; font-family:sans-serif; max-width:500px; margin:50px auto; padding:20px; border:1px solid #27272a; border-radius:12px;">
          <h2>Careers at LeverMock - Data Analyst</h2>
          <form action="/submit" method="POST" enctype="multipart/form-data">
            <div class="application-question" style="margin-bottom:15px;">
              <label class="application-label">Full Name *</label><br/>
              <input type="text" name="name" required style="background:#18181b; border:1px solid #27272a; color:#fff; padding:8px; width:100%; border-radius:6px;"/>
            </div>
            <div class="application-question" style="margin-bottom:15px;">
              <label class="application-label">Email Address *</label><br/>
              <input type="email" name="email" required style="background:#18181b; border:1px solid #27272a; color:#fff; padding:8px; width:100%; border-radius:6px;"/>
            </div>
            <div class="application-question" style="margin-bottom:15px;">
              <label class="application-label">Resume upload *</label><br/>
              <input type="file" id="resume-upload-input" name="resume" required style="color:#ccc;"/>
            </div>
            <div style="margin-top:20px;">
              <button type="submit" id="btn-submit" style="background:#4f46e5; border:none; color:#fff; padding:10px 20px; font-weight:bold; cursor:pointer; border-radius:6px; width:100%;">
                Submit Application
              </button>
            </div>
          </form>
        </body>
      </html>
    `);
    return;
  }

  // Sensitive Sponsor Question Form (pauses automation!)
  if (url === '/sensitive') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <html>
        <head><title>Careers - Sensitive Mock</title></head>
        <body style="background:#09090b; color:#f4f4f5; font-family:sans-serif; max-width:500px; margin:50px auto; padding:20px; border:1px solid #27272a; border-radius:12px;">
          <h2>Apply for BI Analyst Role</h2>
          <form id="application_form" action="/submit" method="POST" enctype="multipart/form-data">
            <div style="margin-bottom:12px;">
              <label for="first_name">First Name *</label><br/>
              <input type="text" id="first_name" name="job_application[first_name]" required style="background:#18181b; border:1px solid #27272a; color:#fff; padding:8px; width:100%; border-radius:6px;"/>
            </div>
            <div style="margin-bottom:12px;">
              <label for="last_name">Last Name *</label><br/>
              <input type="text" id="last_name" name="job_application[last_name]" required style="background:#18181b; border:1px solid #27272a; color:#fff; padding:8px; width:100%; border-radius:6px;"/>
            </div>
            <div style="margin-bottom:12px;">
              <label for="email">Email *</label><br/>
              <input type="email" id="email" name="job_application[email]" required style="background:#18181b; border:1px solid #27272a; color:#fff; padding:8px; width:100%; border-radius:6px;"/>
            </div>
            
            <!-- Pause Question! -->
            <div style="margin-bottom:12px; border:1px solid #ca8a04; padding:12px; border-radius:8px; background:#ca8a04/10;">
              <label for="spons">Will you now or in the future require visa sponsorship? *</label><br/>
              <select id="spons" name="job_application[answers][question_1]" required style="background:#18181b; border:1px solid #27272a; color:#fff; padding:8px; width:100%; border-radius:6px; margin-top:5px;">
                <option value="">-- Select --</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div style="margin-bottom:12px;">
              <label for="resume">Resume / CV *</label><br/>
              <input type="file" id="resume" name="job_application[resume]" required style="color:#ccc;"/>
            </div>
            <div style="margin-top:20px;">
              <button type="submit" id="submit_app" style="background:#4f46e5; border:none; color:#fff; padding:10px 20px; font-weight:bold; cursor:pointer; border-radius:6px; width:100%;">
                Submit Application
              </button>
            </div>
          </form>
        </body>
      </html>
    `);
    return;
  }

  // Default catch-all index
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <html>
      <head><title>Mock ATS Server</title></head>
      <body style="background:#09090b; color:#f4f4f5; font-family:sans-serif; text-align:center; padding-top:50px;">
        <h1>ApplyPilot Mock ATS Sandbox</h1>
        <p>Sandbox testing routes:</p>
        <ul style="list-style:none; padding:0; line-height:2;">
          <li><a href="/greenhouse" style="color:#6366f1;">/greenhouse</a> (Greenhouse Form)</li>
          <li><a href="/lever" style="color:#6366f1;">/lever</a> (Lever Form)</li>
          <li><a href="/sensitive" style="color:#6366f1;">/sensitive</a> (Visa checkpoint trigger)</li>
        </ul>
      </body>
    </html>
  `);
});

server.listen(PORT, () => {
  console.log(`Mock ATS server listening on http://localhost:${PORT}`);
});

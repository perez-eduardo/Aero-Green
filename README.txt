AeroGreen FBO website prototype

Quick start
1. Open public/index.html in a web browser.
2. Choose Customer portal or FBO command center.
3. Submit the sample customer form to see the airport matching flow.

For the smoothest local preview, open PowerShell in the public folder and run:
  py -m http.server 8000
Then visit http://localhost:8000

This is a front-end demo. It does not require a database or API key. Form results and staff approvals are simulated in the browser.

The request relay demonstrates a FlightBridge-style workflow: a customer submits a structured request, the FBO reviews aircraft fit, capacity, PPR/restrictions, fees, and services, then staff can request more information or approve the request. The flight-status card demonstrates a FlightStats/Cirium-style ETA signal. It is intentionally labeled as a demo feed and does not grant booking or movement authority.

To test the workflow:
1. Submit the customer form.
2. Choose Request confirmation on an airport result.
3. Open the FBO team portal.
4. Try Request more information or Approve for final confirmation.
5. Return to the customer portal to see the updated request status.

Additional demo controls:
- Notifications opens the current operations watch list.
- All requests cycles through the queue filters.
- View all requests opens a queue summary.
- Review approval log opens the AI-to-human audit trail.
- The form blocks a departure time that occurs before arrival.

The hero visual is stored at public/assets/heavy-business-jet-hero.png.

Research notes are in RESEARCH-SOURCES.md and FEE-RESEARCH.md.

Hosting on Railway
The site files live in public/. The Staticfile in the root tells Railway to serve that folder, so no build step or server code is needed. Connect the GitHub repo in Railway (or run `railway up`), then generate a domain under the service's Networking settings.


export const knowledgeArticles = {

  home: `

<h1>📚 WorkForge Knowledge Center</h1>

<div class="version-badge">
    Version 5.5 • Release Candidate 3
</div>

<p class="knowledge-intro">
    Welcome to the WorkForge Knowledge Center.
    Find product documentation, feature guides, release notes,
    and best practices for every major module of the platform.
</p>

<div class="knowledge-home-grid">

    <div
    class="knowledge-card"
    onclick="loadKnowledgeArticle('dashboard')">

    <h3>📊 Dashboard</h3>

    ...
</div>

    <div class="knowledge-card"
     onclick="loadKnowledgeArticle('scheduling')">
        <h3>📅 Scheduling</h3>
        ...
</div>

    <div class="knowledge-card"
     onclick="loadKnowledgeArticle('incidentManagement')">
        <h3>🚨 Incident Management</h3>
        ...
</div>

    <div class="knowledge-card"
     onclick="loadKnowledgeArticle('patrol')">
        <h3>🚓 Patrol Operations</h3>
        ...
</div>

    <div class="knowledge-card"
     onclick="loadKnowledgeArticle('clientPortal')">
        <h3>👥 Client Portal</h3>
        ...
</div>

    <div class="knowledge-card"
     onclick="loadKnowledgeArticle('analytics')">
        <h3>📈 Analytics</h3>
        ...
</div>

</div>

<hr>

<h2>Getting Started</h2>

<p>
Select a topic from the navigation menu to learn more
about each WorkForge module and its capabilities.
</p>

`,

    "whats-new": `

        <h1>✨ What's New in WorkForge 5.5</h1>

        <div class="version-badge">

            Version 5.5 • Release Candidate 3

        </div>

        <h2>🚀 Identity Platform</h2>

        <p>

            Unified authentication,
            role-based authorization,
            and employee identity integration.

        </p>

        <h2>📅 Advanced Scheduling</h2>

        <p>

            Recurring scheduling,
            conflict detection,
            marketplace publishing,
            and mileage incentives.

        </p>

        <h2>🚔 Patrol Operations</h2>

        <p>

            Digital patrol execution,
            checkpoint tracking,
            patrol analytics,
            and operational accountability.

        </p>

     `,

     faq: `

<h1>Frequently Asked Questions</h1>

<div class="version-badge">
Version 5.5 • RC3
</div>

<h2>What is WorkForge?</h2>

<p>
WorkForge is a workforce management platform designed for
security companies, property managers, and field operations.
It combines scheduling, patrol management, incident reporting,
asset tracking, analytics, and client communication into a
single application.
</p>

<h2>Who uses WorkForge?</h2>

<p>
WorkForge supports supervisors, field officers,
clients, administrators, and management teams through
role-based dashboards and permissions.
</p>

<h2>Where is my data stored?</h2>

<p>
Application data is stored securely using Firebase
Authentication and Cloud Firestore.
</p>

<h2>Does WorkForge support mobile devices?</h2>

<p>
Yes. The platform is designed with responsive layouts
to support desktop, tablet, and mobile devices.
</p>

<h2>Can clients view activity?</h2>

<p>
Yes. The Client Portal provides approved visibility
into officer activity, patrols, incidents, and
property health metrics.
</p>

`,

dashboard: `

<h1>Dashboard</h1>

<div class="version-badge">
Version 5.5 • RC3
</div>

<p>
The Dashboard provides supervisors and administrators with a
real-time operational overview of workforce activity across the
organization.
</p>

<h2>Dashboard Features</h2>

<ul>
<li>Live workforce statistics</li>
<li>Assignment overview</li>
<li>Open incident monitoring</li>
<li>Asset maintenance tracking</li>
<li>Recent activity feed</li>
<li>Interactive operations map</li>
</ul>

<h2>Statistics Cards</h2>

<p>
The dashboard displays key operational metrics including active
employees, assignments, sites, incidents, and assets currently
requiring maintenance.
</p>

<h2>Live Updates</h2>

<p>
Dashboard information updates automatically through Cloud
Firestore realtime listeners, ensuring supervisors always have
current operational information.
</p>

`,

scheduling: `

<h1>Scheduling</h1>

<div class="version-badge">
Version 5.5 • RC3
</div>

<p>
The Scheduling module manages employee assignments,
open shifts, recurring schedules, and supervisor
approvals from a centralized interface.
</p>

<h2>Features</h2>

<ul>
<li>Create employee schedules</li>
<li>Edit existing assignments</li>
<li>Delete scheduled shifts</li>
<li>Recurring scheduling</li>
<li>Marketplace publishing</li>
<li>Conflict detection</li>
<li>Duplicate schedule prevention</li>
<li>Mileage incentive calculations</li>
</ul>

<h2>Marketplace Integration</h2>

<p>
Open shifts can be published to the Marketplace where
qualified officers may request assignment approval.
Supervisors retain final approval authority.
</p>

<h2>Realtime Updates</h2>

<p>
Scheduling data is synchronized through Cloud Firestore
listeners, providing immediate updates across the
application.
</p>

`,

patrol: `

<h1>Patrol Operations</h1>

<div class="version-badge">
Version 5.5 • RC3
</div>

<p>
Patrol Operations provides structured patrol execution,
checkpoint verification, patrol analytics, and officer
accountability.
</p>

<h2>Capabilities</h2>

<ul>
<li>Patrol templates</li>
<li>Checkpoint management</li>
<li>Realtime patrol tracking</li>
<li>Overdue patrol detection</li>
<li>Officer activity timeline</li>
<li>Supervisor visibility</li>
</ul>

<h2>Monitoring</h2>

<p>
Every patrol event is recorded to support operational
oversight and historical reporting.
</p>

`,

incidentManagement: `

<h1>Incident Management</h1>

<div class="version-badge">
Version 5.5 • RC3
</div>

<p>
The Incident Management module provides a complete workflow
for reporting, reviewing, assigning, and resolving operational
incidents.
</p>

<h2>Features</h2>

<ul>
<li>Incident reporting</li>
<li>Case number generation</li>
<li>Supervisor review</li>
<li>Investigation workflow</li>
<li>Evidence tracking</li>
<li>Status management</li>
<li>Resolution documentation</li>
</ul>

<h2>Lifecycle</h2>

<p>
Incidents progress through a structured workflow from
submission to final resolution, ensuring accountability
and complete documentation.
</p>

`,

marketplace: `

<h1>Marketplace</h1>

<div class="version-badge">
Version 5.5 • RC3
</div>

<p>
The Marketplace allows supervisors to publish open shifts
that qualified officers can claim for approval.
</p>

<h2>Features</h2>

<ul>
<li>Publish open shifts</li>
<li>Officer claim requests</li>
<li>Supervisor approvals</li>
<li>Automatic schedule creation</li>
<li>Activity logging</li>
</ul>

<h2>Approval Process</h2>

<p>
Claim requests remain pending until approved by a supervisor.
Approved requests automatically create a scheduled shift.
</p>

`,

clientPortal: `

<h1>Client Portal</h1>

<div class="version-badge">
Version 5.5 • RC3
</div>

<p>
The Client Portal provides customers with secure visibility
into operations occurring at their assigned properties.
</p>

<h2>Features</h2>

<ul>
<li>Property Health</li>
<li>Today's Officers</li>
<li>Patrol Activity</li>
<li>Incident Summary</li>
<li>Operational KPIs</li>
<li>Real-time updates</li>
</ul>

<h2>Purpose</h2>

<p>
The Client Portal improves transparency by allowing clients
to monitor security operations without exposing internal
administrative functions.
</p>

`,

analytics: `

<h1>Analytics</h1>

<div class="version-badge">
Version 5.5 • RC3
</div>

<p>
The Analytics module transforms operational data into
meaningful metrics that support informed decision-making.
</p>

<h2>Available Metrics</h2>

<ul>
<li>Incident trends</li>
<li>Patrol completion rates</li>
<li>Workforce utilization</li>
<li>Scheduling performance</li>
<li>Operational activity</li>
<li>Historical reporting</li>
</ul>

<h2>Continuous Improvement</h2>

<p>
Analytics help supervisors identify trends, improve staffing,
and evaluate operational effectiveness over time.
</p>

`,

    about: `

        <h1>About WorkForge</h1>

        <div class="version-badge">

            Version 5.5 • Release Candidate 3

        </div>

        <p>

            <strong>WorkForge Security Management Platform</strong>

        </p>

        <p>

            WorkForge is an integrated security operations platform
            built to help security organizations manage personnel,
            patrol operations, incident reporting, client communications,
            and operational oversight through a single, unified system.

        </p>

        <p>

            Designed specifically for the security industry,
            WorkForge streamlines daily operations while improving
            accountability, transparency, and operational awareness.

        </p>

        <p>

            <strong>
            Built on real-world law enforcement and security operations
            experience, WorkForge was designed to address the practical
            challenges faced by supervisors, officers, administrators,
            and clients in managing modern security operations.
            </strong>

        </p>

        <h2>Mission</h2>

        <p>

            To provide security organizations with a modern,
            integrated platform that improves operational efficiency,
            accountability, and client confidence.

        </p>

    `

};
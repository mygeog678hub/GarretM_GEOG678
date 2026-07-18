
export const knowledgeArticles = {

  home: `

<h1>📚 WorkForge Knowledge Center</h1>

<div class="version-badge">
    Version 5.6 • Release Candidate 3
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

<div
class="knowledge-card"
onclick="loadKnowledgeArticle('administration')">

    <h3>🛠️ Administration</h3>

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

administration: `

<div class="knowledge-header">

<h1>Administration Overview</h1>

<div class="knowledge-meta">

    <span><strong>Audience:</strong> Administrators & Supervisors</span>

    <span><strong>Category:</strong> Administration</span>

    <span><strong>Updated:</strong> v5.6</span>

</div>

<div class="version-badge">
    WorkForge Dashboard v5.6
</div>
</div>

<p>
Welcome to the WorkForge Dashboard Administration Center.
</p>

<p>
Administrators are responsible for managing personnel, scheduling,
client operations, incidents, patrols, assets, and company settings.
The dashboard provides centralized access to every operational component
of the platform.
</p>

<h2>Dashboard Overview</h2>

<ul>
    <li>Employees</li>
    <li>Active Assignments</li>
    <li>Active Sites</li>
    <li>Today's Operations</li>
    <li>Assets in Maintenance</li>
    <li>Open Incidents</li>
</ul>

<div class="knowledge-header">

<h2>Administrator Responsibilities</h2>

<div class="knowledge-callout knowledge-info">

    <strong>Administrator Access</strong>

    <p>
        Administrators have full access to employee management,
        scheduling, incidents, patrol operations,
        company settings, and reporting.
    </p>

</div>

<div class="knowledge-callout knowledge-tip">

<strong>Best Practice</strong>

<p>
Review the dashboard at the beginning of each shift to identify
open incidents, staffing shortages, and marketplace activity.
</p>

</div>

<div class="knowledge-callout knowledge-warning">

<strong>Important</strong>

<p>
Changes to company settings affect the entire organization and
should only be made by authorized administrators.
</p>

</div>
</div>

`,

dashboard: `

<div class="knowledge-header">

    <h1>📊 Dashboard Overview</h1>

    <div class="knowledge-meta">

    <span><strong>Audience:</strong> Administrators & Supervisors</span>

    <span><strong>Category:</strong> Dashboard</span>

    <span><strong>Updated:</strong> v5.6</span>

</div>

    <div class="version-badge">
        WorkForge Dashboard v5.6
    </div>

</div>

<p>
The Dashboard serves as the operational command center for
WorkForge Dashboard. It provides administrators with real-time
visibility into personnel, scheduling, incidents, patrol
operations, and overall company performance.
</p>

<h2>Key Performance Indicators</h2>

<ul>
    <li>Employees</li>
    <li>Active Assignments</li>
    <li>Active Sites</li>
    <li>Today's Operations</li>
    <li>Assets in Maintenance</li>
    <li>Open Incidents</li>
</ul>

<div class="knowledge-callout knowledge-info">

<strong>Operational Visibility</strong>

<p>
The KPI cards provide a real-time snapshot of company operations,
allowing administrators to quickly identify staffing levels,
active sites, and outstanding incidents.
</p>

</div>

<h2>Interactive Map</h2>

<p>
The dashboard map displays operational locations and client sites,
providing geographic awareness of current operations.
</p>

<div class="knowledge-callout knowledge-tip">

<strong>Best Practice</strong>

<p>
Review the dashboard at the beginning of each shift to identify
staffing shortages, open incidents, and marketplace activity.
</p>

</div>

<h2>Activity Feed</h2>

<p>
The Activity Feed records scheduling changes, incident activity,
marketplace updates, patrol events, and other operational actions
as they occur.
</p>

<div class="knowledge-callout knowledge-warning">

<strong>Important</strong>

<p>
Dashboard metrics update as data changes throughout the application.
Always verify critical operational decisions using the underlying
records when appropriate.
</p>

</div>

`,

    "whats-new": `

        <h1>✨ What's New in WorkForge 5.6</h1>

        <div class="version-badge">

            Version 5.6 • Release Candidate 3

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
Version 5.6 • RC3
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

scheduling: `

<div class="knowledge-header">

    <h1>📅 Scheduling</h1>

    <div class="knowledge-meta">

    <span><strong>Audience:</strong> Administrators & Supervisors</span>

    <span><strong>Category:</strong> Operations</span>

    <span><strong>Updated:</strong> v5.6</span>

</div>

    <div class="version-badge">
        WorkForge Dashboard v5.6
    </div>

</div>

<p>
The Scheduling module serves as the central hub for workforce
management. Administrators and supervisors can create employee
assignments, manage recurring schedules, publish Marketplace shifts,
and monitor staffing levels from a single interface.
</p>

<div class="knowledge-callout knowledge-info">

<strong>Overview</strong>

<p>
Scheduling combines employee assignments, recurring scheduling,
Marketplace integration, conflict detection, and mileage calculations
into one streamlined workflow.
</p>

</div>

<h2>Core Features</h2>

<ul>

<li>Create employee schedules</li>

<li>Edit or delete assignments</li>

<li>Recurring scheduling</li>

<li>Marketplace publishing</li>

<li>Conflict detection</li>

<li>Duplicate schedule prevention</li>

<li>Mileage incentive calculations</li>

<li>Weekly Schedule Board</li>

</ul>

<div class="knowledge-callout knowledge-tip">

<strong>Best Practice</strong>

<p>
Review schedules daily for staffing gaps and Marketplace requests to
maintain full operational coverage.
</p>

</div>

<h2>Workflow</h2>

<ol>

<li>Create or edit a shift.</li>

<li>Validate scheduling conflicts automatically.</li>

<li>Publish open shifts when staffing is unavailable.</li>

<li>Approve Marketplace claim requests.</li>

<li>Monitor assignments using the Weekly Schedule Board.</li>

</ol>

<div class="knowledge-callout knowledge-warning">

<strong>Important</strong>

<p>
Schedule changes immediately affect operational staffing and are
synchronized throughout the application using Cloud Firestore.
</p>

</div>

<hr>

<p>

<strong>Last Updated</strong><br>

WorkForge Dashboard v5.6

</p>

`,

patrol: `

<div class="knowledge-header">

    <h1>🚓 Patrol Operations</h1>

    <div class="knowledge-meta">

    <span><strong>Audience:</strong> Officers & Supervisors</span>

    <span><strong>Category:</strong> Operations</span>

    <span><strong>Updated:</strong> v5.6</span>

</div>

    <div class="version-badge">
        WorkForge Dashboard v5.6
    </div>

</div>

<p>
Patrol Operations provides structured patrol execution, checkpoint
verification, officer accountability, and supervisor oversight for
field operations.
</p>

<div class="knowledge-callout knowledge-info">

<strong>Overview</strong>

<p>
Every patrol is documented to improve accountability, operational
visibility, and historical reporting across client sites.
</p>

</div>

<h2>Core Features</h2>

<ul>

<li>Patrol templates</li>

<li>Checkpoint management</li>

<li>Realtime patrol tracking</li>

<li>Overdue patrol detection</li>

<li>Officer activity timeline</li>

<li>Supervisor visibility</li>

<li>Patrol analytics</li>

</ul>

<div class="knowledge-callout knowledge-tip">

<strong>Best Practice</strong>

<p>
Review overdue patrol alerts promptly to ensure officers remain on
schedule and client coverage requirements are met.
</p>

</div>

<h2>Operational Workflow</h2>

<ol>

<li>Create patrol templates.</li>

<li>Assign checkpoints.</li>

<li>Execute patrols in the field.</li>

<li>Monitor patrol completion in real time.</li>

<li>Review patrol history and analytics.</li>

</ol>

<div class="knowledge-callout knowledge-warning">

<strong>Important</strong>

<p>
Patrol records become part of the permanent operational history and
should accurately reflect completed field activity.
</p>

</div>

<hr>

<p>

<strong>Last Updated</strong><br>

WorkForge Dashboard v5.6

</p>

`,

incidentManagement: `

<div class="knowledge-header">

    <h1>🚨 Incident Management</h1>

    <div class="knowledge-meta">

    <span><strong>Audience:</strong> Officers, Supervisors & Administrators</span>

    <span><strong>Category:</strong> Operations</span>

    <span><strong>Updated:</strong> v5.6</span>

</div>

    <div class="version-badge">
        WorkForge Dashboard v5.6
    </div>

</div>

<p>
The Incident Management module provides a complete workflow for
reporting, reviewing, investigating, approving, and resolving
operational incidents while maintaining comprehensive documentation.
</p>

<div class="knowledge-callout knowledge-info">

<strong>Overview</strong>

<p>
Every incident receives a unique case number and progresses through a
structured review process to ensure accountability and complete
documentation.
</p>

</div>

<h2>Core Features</h2>

<ul>

<li>Incident reporting</li>

<li>Automatic case number generation</li>

<li>Supervisor review workflow</li>

<li>Investigation management</li>

<li>Evidence tracking</li>

<li>Status management</li>

<li>Supplemental reports</li>

<li>Resolution documentation</li>

</ul>

<div class="knowledge-callout knowledge-tip">

<strong>Best Practice</strong>

<p>
Complete incident reports as soon as practical while information is
current, and include sufficient detail to support supervisory review.
</p>

</div>

<h2>Incident Lifecycle</h2>

<ol>

<li>Submit an incident report.</li>

<li>Supervisor reviews the submission.</li>

<li>Additional information may be requested.</li>

<li>Investigation and documentation are completed.</li>

<li>The incident is resolved and archived.</li>

</ol>

<div class="knowledge-callout knowledge-warning">

<strong>Important</strong>

<p>
Once approved, incident records become part of the organization's
permanent operational history and should accurately document events.
</p>

</div>

<hr>

<p>

<strong>Last Updated</strong><br>

WorkForge Dashboard v5.6

</p>

`,

marketplace: `

<div class="knowledge-header">

    <h1>🏪 Marketplace</h1>

    <div class="knowledge-meta">

    <span><strong>Audience:</strong> Supervisors & Officers</span>

    <span><strong>Category:</strong> Operations</span>

    <span><strong>Updated:</strong> v5.6</span>

</div>

    <div class="version-badge">
        WorkForge Dashboard v5.6
    </div>

</div>

<p>

The Marketplace allows supervisors to publish open shifts for qualified
officers to claim. This feature improves staffing flexibility while
maintaining supervisory oversight and approval authority.

</p>

<div class="knowledge-callout knowledge-info">

<strong>Overview</strong>

<p>

Marketplace shifts remain available until claimed or cancelled.
Supervisors review all claim requests before an assignment is officially
added to the schedule.

</p>

</div>

<h2>Core Features</h2>

<ul>

<li>Publish open shifts</li>

<li>Officer claim requests</li>

<li>Supervisor approval workflow</li>

<li>Automatic schedule creation</li>

<li>Activity logging</li>

<li>Claim request management</li>

<li>Shift cancellation</li>

</ul>

<div class="knowledge-callout knowledge-tip">

<strong>Best Practice</strong>

<p>

Review pending Marketplace claims frequently to minimize vacant posts
and ensure timely staffing decisions.

</p>

</div>

<h2>Workflow</h2>

<ol>

<li>Publish an open shift.</li>

<li>Qualified officers submit claim requests.</li>

<li>Supervisors review each request.</li>

<li>Approved claims automatically create scheduled assignments.</li>

<li>Activity is recorded in the operational log.</li>

</ol>

<div class="knowledge-callout knowledge-warning">

<strong>Important</strong>

<p>

Only approved Marketplace requests become scheduled assignments.
Unapproved requests do not modify staffing schedules.

</p>

</div>

<hr>

<p>

<strong>Last Updated</strong><br>

WorkForge Dashboard v5.6

</p>

`,

clientPortal: `

<div class="knowledge-header">

    <h1>👥 Client Portal</h1>

    <div class="knowledge-meta">

    <span><strong>Audience:</strong> Clients</span>

    <span><strong>Category:</strong> Client Services</span>

    <span><strong>Updated:</strong> v5.6</span>

</div>

    <div class="version-badge">
        WorkForge Dashboard v5.6
    </div>

</div>

<p>

The Client Portal provides customers with secure visibility into the
security operations occurring at their assigned properties while
protecting confidential administrative information.

</p>

<div class="knowledge-callout knowledge-info">

<strong>Overview</strong>

<p>

Clients receive operational transparency through dashboards,
incident summaries, patrol activity, and property health indicators
without access to internal management functions.

</p>

</div>

<h2>Core Features</h2>

<ul>

<li>Property Health dashboard</li>

<li>Today's Officers</li>

<li>Patrol Activity</li>

<li>Incident Summary</li>

<li>Operational KPIs</li>

<li>Real-time operational updates</li>

</ul>

<div class="knowledge-callout knowledge-tip">

<strong>Best Practice</strong>

<p>

Review the Property Health dashboard regularly to stay informed of
security operations and recent activity at your locations.

</p>

</div>

<h2>Client Experience</h2>

<p>

The Client Portal is designed to improve communication, transparency,
and confidence by providing meaningful operational information in a
simple, easy-to-understand format.

</p>

<div class="knowledge-callout knowledge-warning">

<strong>Important</strong>

<p>

Clients only have access to information associated with their assigned
properties and cannot view internal administrative functions.

</p>

</div>

<hr>

<p>

<strong>Last Updated</strong><br>

WorkForge Dashboard v5.6

</p>

`,

analytics: `

<div class="knowledge-header">

    <h1>📈 Analytics</h1>

    <div class="knowledge-meta">

    <span><strong>Audience:</strong> Administrators & Supervisors</span>

    <span><strong>Category:</strong> Reporting</span>

    <span><strong>Updated:</strong> v5.6</span>

</div>

    <div class="version-badge">
        WorkForge Dashboard v5.6
    </div>

</div>

<p>

The Analytics module transforms operational data into meaningful
performance metrics that support informed decision-making and
continuous operational improvement.

</p>

<div class="knowledge-callout knowledge-info">

<strong>Overview</strong>

<p>

Analytics consolidate scheduling, patrol, incident, and workforce
information into actionable insights for supervisors and administrators.

</p>

</div>

<h2>Available Metrics</h2>

<ul>

<li>Incident trends</li>

<li>Patrol completion rates</li>

<li>Workforce utilization</li>

<li>Scheduling performance</li>

<li>Operational activity</li>

<li>Historical reporting</li>

</ul>

<div class="knowledge-callout knowledge-tip">

<strong>Best Practice</strong>

<p>

Review operational metrics regularly to identify staffing trends,
improve efficiency, and support data-driven decision making.

</p>

</div>

<h2>Operational Benefits</h2>

<p>

Historical reporting and trend analysis help leadership evaluate
performance, allocate resources, and improve operational effectiveness
over time.

</p>

<div class="knowledge-callout knowledge-warning">

<strong>Important</strong>

<p>

Analytics should be interpreted alongside operational knowledge and
current conditions to provide the most accurate assessment of
performance.

</p>

</div>

<hr>

<p>

<strong>Last Updated</strong><br>

WorkForge Dashboard v5.6

</p>

`,

    about: `

<div class="knowledge-header">

    <h1>ℹ️ About WorkForge</h1>

    <div class="knowledge-meta">

    <span><strong>Audience:</strong> All Users</span>

    <span><strong>Category:</strong> Platform</span>

    <span><strong>Updated:</strong> v5.6</span>

</div>

    <div class="version-badge">
        WorkForge Dashboard v5.6
    </div>

</div>

<p>

<strong>WorkForge Security Management Platform</strong>

</p>

<p>

WorkForge is an integrated security operations platform designed to
help security organizations manage personnel, scheduling, patrol
operations, incident reporting, client communications, and operational
oversight through a single unified system.

</p>

<div class="knowledge-callout knowledge-info">

<strong>Designed for Security Professionals</strong>

<p>

Built on real-world law enforcement and private security experience,
WorkForge addresses the practical operational challenges faced by
administrators, supervisors, officers, and clients every day.

</p>

</div>

<h2>Platform Modules</h2>

<ul>

<li>Administration</li>

<li>Scheduling</li>

<li>Marketplace</li>

<li>Incident Management</li>

<li>Patrol Operations</li>

<li>Client Portal</li>

<li>Analytics</li>

<li>Knowledge Center</li>

</ul>

<div class="knowledge-callout knowledge-tip">

<strong>Mission</strong>

<p>

Provide security organizations with a modern, integrated platform
that improves operational efficiency, accountability, transparency,
and client confidence.

</p>

</div>

<div class="knowledge-callout knowledge-warning">

<strong>Commitment</strong>

<p>

WorkForge continues to evolve through practical operational experience,
user feedback, and continuous platform improvement.

</p>

</div>

<hr>

<p>

<strong>Last Updated</strong><br>

WorkForge Dashboard v5.6

</p>

`,

};
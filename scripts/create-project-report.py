"""Build the assignment report from the verified project snapshot."""
from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Preformatted, Image, Flowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output/pdf/Drift_Database_Project_Report.pdf'
OUT.parent.mkdir(parents=True, exist_ok=True)
BLUE = colors.HexColor('#0071e3'); INK = colors.HexColor('#1d1d1f'); GRAY = colors.HexColor('#62626a')
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='TitleDrift', fontName='Helvetica-Bold', fontSize=34, leading=38, textColor=INK, spaceAfter=20))
styles.add(ParagraphStyle(name='SectionDrift', fontName='Helvetica-Bold', fontSize=23, leading=28, textColor=INK, spaceAfter=16))
styles.add(ParagraphStyle(name='SubDrift', fontName='Helvetica-Bold', fontSize=12, leading=16, textColor=INK, spaceBefore=12, spaceAfter=6))
styles.add(ParagraphStyle(name='BodyDrift', fontName='Helvetica', fontSize=10, leading=15, textColor=INK, spaceAfter=9))
styles.add(ParagraphStyle(name='SmallDrift', fontName='Helvetica', fontSize=8, leading=11, textColor=GRAY, spaceAfter=5))
styles.add(ParagraphStyle(name='CellDrift', fontName='Helvetica', fontSize=8.2, leading=11, textColor=INK))
styles.add(ParagraphStyle(name='CodeDrift', fontName='Courier', fontSize=8, leading=11, textColor=INK, backColor=colors.HexColor('#f5f5f7'), borderPadding=10, spaceAfter=12))
story=[]
def p(text, style='BodyDrift'): return Paragraph(text,styles[style])
def body(text): story.append(p(text))
def sub(text): story.append(p(text,'SubDrift'))
def page(n,title):
    if story: story.append(PageBreak())
    story.append(p(f'{n:02d} / DATABASE SYSTEMS','SmallDrift'))
    story.append(p(title,'SectionDrift'))
def table(headers,rows,widths):
    data=[[p('<b>'+escape(x)+'</b>','CellDrift') for x in headers]]+[[p(escape(str(x)),'CellDrift') for x in row] for row in rows]
    t=Table(data,colWidths=widths,repeatRows=1,hAlign='LEFT')
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#edf4fc')),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),9),('RIGHTPADDING',(0,0),(-1,-1),9),('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8),('LINEBELOW',(0,0),(-1,-1),.4,colors.HexColor('#e4e4e9'))]))
    story.append(t);story.append(Spacer(1,10))
def code(text): story.append(Preformatted(text,styles['CodeDrift']))

page(1,'Drift Car Rental')
story.append(p('Database design &amp;<br/>implementation report','TitleDrift'))
body('Database module project | 30 September 2026')
body('<b>Implementation snapshot:</b> GitHub branch <font color="#0071e3">codex/mysql-persistence</font>, application commit <b>5e51535</b>. This report describes the implemented local system, rather than a proposed design.')
table(['Relational tables','Foreign keys','CHECK constraints','Fleet vehicles'],[['21','24','32','40']],[123,123,123,130])
sub('Project purpose')
body('Drift connects a car-rental website to a persistent MySQL database. Customers browse the catalogue, register, sign in, select rental dates and extras, and create reservations. Administrators manage fleet records, review cancellation requests and inspect the live database structure.')
sub('Current outcome')
body('The local application stores accounts, vehicles, bookings and payment records in MySQL. Checkout approves payments automatically and saves the reservation; it does not collect card information or charge money. These approvals are excluded from collected-revenue reports.')
sub('Report guide')
table(['Page','Content'],[['2-3','Architecture, requirements and relational model'],['4-5','Relationships, integrity, transactions and security'],['6-7','SQL examples and verification evidence'],['8','Handover, limitations and project references']],[45,454])
body('Prepared from the project source, schema and local verification results. Group names, student numbers and the marking rubric were not supplied; this report makes no claim of rubric compliance.')

page(2,'Architecture & requirements')
table(['Layer','Implemented responsibility'],[['Browser / React','Catalogue, registration, account pages, checkout and administration. The browser retains only the checkout draft; the server controls identity and pricing.'],['Vinext / Node.js','Route handlers validate requests, enforce access rules and execute application workflows. The local build uses Vite and Nitro.'],['mysql2 / repository','Parameterized SQL, connection pooling and transaction handling.'],['MySQL / InnoDB','Persistent records, relationships, uniqueness, checks, generated columns and transaction locks.']],[125,374])
sub('User roles')
body('<b>Customer:</b> browse vehicles and extras, create reservations, view their own bookings and request cancellation. New registrations receive the customer role. <b>Administrator:</b> manage vehicles, add branches/extras, access all bookings, make supported status decisions and inspect the database schema.')
sub('Implemented requirements')
table(['Requirement','Implementation'],[['Persistence','Stored data remains available across page refreshes and server restarts.'],['Availability','Server checks date overlap while holding a vehicle row lock.'],['Pricing','Vehicle and extra prices are read from MySQL and recalculated before booking.'],['Access control','Server checks sessions, administrator role and booking ownership.'],['Audit trail','BookingStatusHistory records status changes; CancellationRequest records review decisions.'],['Database presentation','Database Studio exposes actual metadata, relationships, row counts and SQL definitions to administrators.']],[125,374])
sub('Deployment boundary')
body('The application runs at http://127.0.0.1:3000 on the project computer, connected to local MySQL. GitHub holds the source and schema; it is not a running database or website host. Online deployment is outside the current scope.')

page(3,'Relational model')
body('The schema separates locations, reusable catalogue data, authentication and reservation records. All 21 tables use InnoDB. The inspected local schema contains 177 columns and 43 primary/unique indexes, in addition to its foreign keys and CHECK constraints.')
table(['Area','Tables and responsibilities'],[['Locations (3)','Province: province names. City: city within a province. Branch: rental location and contact details.'],['Fleet (6)','VehicleCategory: body type. VehicleModel: brand/model classification. Vehicle: registered asset, branch, rate and status. VehicleImage: ordered gallery and credits. Feature: reusable feature names. VehicleFeature: vehicle-feature association.'],['Accounts (4)','Customer: renter profile. AppUser: login and role. UserSession: hashed session tokens. PasswordResetToken: schema support for a future reset workflow.'],['Reservations (3)','Booking: dates, customer/vehicle snapshots and totals. RentalExtra: available add-ons and pricing. BookingExtra: selected add-ons with historical prices.'],['Payment and audit (5)','Payment: payment attempts and statuses. CancellationRequest: requests and reviews. BookingStatusHistory: status audit. BookingEmail: email-delivery tracking structure. VehicleReview: one review per booking.']],[105,394])
sub('Normalization decisions')
body('<b>Atomic values:</b> features and galleries use child/association tables rather than comma-separated columns. <b>Many-to-many relationships:</b> VehicleFeature separates reusable feature definitions from individual vehicles; BookingExtra associates reservations with reusable extras.')
body('<b>Reduced repetition:</b> city/province data is separated from branches, and model/category data is separated from individual registered vehicles. This reduces update anomalies. A formal proof that every relation meets third normal form is outside this report.')
body('<b>Deliberate historical snapshots:</b> Booking stores the customer name/email, vehicle name and applied daily rate. BookingExtra stores the selected name and price. These values preserve the original reservation when the live catalogue changes; this is intentional duplication for historical accuracy.')
sub('Schema does not equal completed functionality')
body('Password-reset and email-tracking tables exist, but the corresponding delivery workflows are not implemented. Review rows can feed catalogue ratings; a complete customer review submission and moderation workflow has not been verified.')

class Relations(Flowable):
    def __init__(self): Flowable.__init__(self);self.width=499;self.height=335
    def draw(self):
        c=self.canv
        nodes={'Customer':(0,270),'Vehicle':(184,270),'Branch':(368,270),'Booking':(184,165),'Payment':(0,55),'BookingExtra':(184,55),'CancellationRequest':(368,55)}
        edges=[('Customer','Booking'),('Vehicle','Booking'),('Branch','Booking'),('Booking','Payment'),('Booking','BookingExtra'),('Booking','CancellationRequest')]
        c.setStrokeColor(colors.HexColor('#b7cce5'));c.setLineWidth(1.4)
        for a,b in edges:
            ax,ay=nodes[a];bx,by=nodes[b];c.line(ax+65,ay,bx+65,by+46)
        for name,(x,y) in nodes.items():
            c.setFillColor(colors.HexColor('#edf4fc') if name=='Booking' else colors.HexColor('#f5f5f7'));c.setStrokeColor(colors.HexColor('#dce1e7'));c.roundRect(x,y,130,46,10,stroke=1,fill=1)
            c.setFillColor(INK);c.setFont('Helvetica-Bold',9);c.drawCentredString(x+65,y+20,name)
        c.setFillColor(GRAY);c.setFont('Helvetica',8);c.drawString(0,12,'Parent records above; reservation and dependent records below.')

page(4,'Relationships & cardinalities')
body('The diagram highlights the reservation core. It is a conceptual subset, not the full 24-foreign-key physical model. Database Studio provides the complete interactive relationship map and SQL definitions.')
story.append(Relations())
table(['Relationship','Cardinality and interpretation'],[['Customer - Booking','One customer can have many bookings. Booking.customer_id is nullable in the schema; the application requires a customer-linked account to book.'],['Vehicle - Booking','One vehicle can appear in many bookings over time. Each booking references one vehicle; overlapping active bookings are rejected.'],['Branch - Booking','Each booking references one pickup branch and one return branch through separate foreign keys. Each branch can serve many bookings.'],['Booking - Payment / extras','One booking can have many payment attempts and selected extras. Each BookingExtra references one RentalExtra.'],['Vehicle - Feature','Many-to-many through VehicleFeature. The composite primary key prevents duplicate associations.'],['Customer - AppUser','Optional one-to-one link enforced by a unique customer_id. Admin accounts may have no customer link.']],[132,367])

page(5,'Integrity, transactions & security')
table(['Mechanism','Concrete example'],[['Primary / foreign keys','VehicleFeature has a composite primary key. Booking references Vehicle, Customer and two Branch roles.'],['Unique constraints','Registration number, booking reference and checkout idempotency key are unique. A generated nullable key allows only one primary image per vehicle.'],['CHECK constraints','Vehicle daily_rate must be positive; booking end_date must not precede start_date; ratings must lie between 1 and 5.'],['Generated columns','Booking rental_days, rental_subtotal and total_cost are computed from dates, the applied rate and extras_total.'],['Indexes','ix_booking_calendar supports vehicle/status/date lookups; session and reset expiry columns have indexes.']],[132,367])
sub('Booking as one transaction')
body('1. Authenticate the customer and validate the request.<br/>2. Lock the selected Vehicle row with SELECT ... FOR UPDATE.<br/>3. Check checkout retries, valid branches and overlapping active bookings.<br/>4. Read current rates and extras; reject a changed expected total.<br/>5. Insert Booking, BookingExtra, Payment and BookingStatusHistory.<br/>6. Commit together, or roll back if any step fails.')
body('Availability treats both dates as inclusive. Charged days are max(1, end date minus start date), so a same-day rental is charged for one day. A cancellation request does not release the vehicle until an administrator approves cancellation.')
sub('Why row checks are not enough')
body('A CHECK constraint validates a row; it cannot by itself prevent two concurrent reservations for the same vehicle. The application combines a vehicle lock and overlap query. All future booking writers must follow the same locking convention. Cancellation decisions also update the booking, request and history together.')
sub('Implemented security controls')
body('Passwords use salted scrypt hashes. Random session tokens are stored only as SHA-256 hashes, expire after seven days and can be revoked. Cookies are HttpOnly and SameSite=Lax, with Secure enabled under HTTPS. Mutations check the request origin. SQL parameters, server role checks and ownership checks protect the database path. Local credentials remain in an ignored environment file.')

page(6,'SQL examples for presentation')
body('These read-only examples match the supplied schema. Run them in MySQL Workbench after selecting drift_car_rental. They are illustrative queries; no result totals below are fabricated. Use the exact identifier case from the imported schema on case-sensitive servers.')
sub('1 / Join vehicles to models, categories and branches')
code('SELECT v.registration_no, m.brand, m.model_name,\n       c.category_name, b.branch_name, v.daily_rate\nFROM Vehicle v\nJOIN VehicleModel m ON m.model_id = v.model_id\nJOIN VehicleCategory c ON c.category_id = m.category_id\nJOIN Branch b ON b.branch_id = v.branch_id\nWHERE v.is_active = 1\nORDER BY v.daily_rate;')
sub('2 / Aggregate reservations by status')
code('SELECT status, COUNT(*) AS reservation_count,\n       COALESCE(SUM(total_cost), 0) AS booking_value\nFROM Booking\nGROUP BY status\nORDER BY status;')
body('Booking value is the sum of reservation prices. It must not be presented as money collected.')
sub('3 / List vehicles without conflicting reservations')
code("SET @pickup = '2027-01-10';\nSET @return = '2027-01-12';\nSELECT v.vehicle_id, v.registration_no\nFROM Vehicle v\nWHERE v.is_active = 1\n  AND v.status NOT IN ('Maintenance', 'Rented')\n  AND NOT EXISTS (\n    SELECT 1 FROM Booking b\n    WHERE b.vehicle_id = v.vehicle_id\n      AND b.status NOT IN ('Cancelled', 'Completed')\n      AND b.start_date <= @return\n      AND b.end_date >= @pickup\n  );")
body('This SELECT illustrates overlap logic. It is not a safe standalone reservation writer: the actual booking workflow performs the check within a transaction while holding the vehicle lock.')
sub('4 / Inspect integrity rules')
code('SHOW CREATE TABLE Booking;\nSHOW INDEX FROM Vehicle;')

page(7,'Verification & interface evidence')
body('Verification completed on the local implementation represented by commit 5e51535. The integration script creates temporary records and removes them afterward. These checks establish the tested workflows, not a claim of complete production readiness.')
table(['Check','Observed result'],[['TypeScript / local build','npx tsc --noEmit and npm run build:local passed.'],['Identity and access','Registration, login, session handling, logout and administrator restrictions passed. Schema access returned 401 for guests, 403 for customers and 200 for admins.'],['Booking integrity','Server pricing, concurrent retry deduplication, overlap rejection, payment-record creation and cancellation flow passed.'],['Schema and catalogue','21 tables, 24 foreign keys, 32 CHECK constraints and 40 vehicles were confirmed by the local metadata check.'],['Browser wording','Checkout displayed automatic approval and the no-charge notice; the inspected page contained no demo/simulation wording. No browser errors were reported in that check.'],['Known test gap','Repository-wide lint is not a clean gate. Load testing, a security audit and a full review of every edge case have not been completed.']],[128,371])
img=ROOT/'docs/database-studio-report.png'
if img.exists():
    story.append(Spacer(1,7));story.append(Image(str(img),width=470,height=323.125))
    story.append(p('Figure 1. Database Studio after the visual refinement. This earlier interface capture includes temporary verification records in its row count; it is not a current business-data total.','SmallDrift'))

page(8,'Handover & remaining work')
sub('Run the local system')
body('Install Node.js 22.13 or newer and MySQL 8.4. Import database/Database_Updated.sql into an empty schema, install dependencies with npm ci, and configure the ignored .env.local file using .env.example. Do not reimport the fresh-install schema over an existing database.')
code('npm run fleet:import\nnpm run build:local\nnpm start')
body('The fleet importer preserves existing registrations and extras. On a fresh installation, register an account and use npm run admin:promote -- YOUR-REGISTERED-EMAIL to grant administrator access. Do not include passwords or session tokens in an assignment submission.')
sub('Remaining work and scope')
table(['Priority','Action'],[['Before submission','Add the group identification details and align this report with the lecturer\'s rubric. Rehearse registration, reservation, cancellation, table inspection and SQL queries. Review catalogue rates and branch details.'],['Known limitations','Email delivery, password reset, email verification and licence verification are not enabled. Some branch, extra and gallery maintenance still requires Workbench.'],['Optional future work','A real payment provider, online hosting, broader automated testing, lint cleanup and operational backup/restore procedures. No money collection is required for the current automatic-approval scope.']],[115,384])
sub('Project sources')
body('All technical findings come from the project artifacts below. The report cites implementation evidence rather than external product claims.')
base='https://github.com/ashleyscomputer/drift-car-rental/blob/5e51535/'
refs=[('Schema and constraints','database/Database_Updated.sql'),('Booking and cancellation transactions','lib/repository.ts'),('Authentication and sessions','lib/server-auth.ts'),('Architecture and route access','docs/ARCHITECTURE.md'),('API contract','docs/API.md'),('Integration checks','scripts/verify-local-mysql.mjs'),('Current roadmap','docs/DATABASE_ROADMAP.md')]
for label,path in refs:
    story.append(p(f'<b>{label}:</b> <link href="{base+path}" color="#0071e3">{escape(path)}</link>','SmallDrift'))
body('<b>Conclusion:</b> Drift demonstrates a working relational database application with persistent records, explicit relationships, server-enforced permissions and transactional reservation handling. Its strongest database-module evidence is the connection between schema constraints, real application operations and repeatable verification.')

def footer(canvas,doc):
    canvas.saveState();w,h=A4
    canvas.setStrokeColor(colors.HexColor('#e4e4e9'));canvas.line(48,43,w-48,43)
    canvas.setFillColor(GRAY);canvas.setFont('Helvetica',8);canvas.drawString(48,29,'DRIFT / DATABASE PROJECT REPORT')
    canvas.drawRightString(w-48,29,f'{doc.page}');canvas.restoreState()
doc=SimpleDocTemplate(str(OUT),pagesize=A4,leftMargin=48,rightMargin=48,topMargin=45,bottomMargin=57,title='Drift Car Rental - Database Project Report',author='Drift project',subject='Relational database design, implementation and verification')
doc.build(story,onFirstPage=footer,onLaterPages=footer)
print(OUT)

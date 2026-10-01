"""Executed by create-project-report.py using its document helpers."""
import re

page(9,'Rubric alignment')
body('Source: Database Systems project 2026.pdf, supplied by the group. Assessment weights: project report 40 marks, implementation 50 marks, extra effort 10 marks. The brief does not specify subcriteria weights; this mapping is evidence, not a predicted grade.')
table(['Requirement','Implementation / report evidence'],[
('Create/add a table','Admin > Database > Manage your tables creates actual MySQL tables. Items 1 and 4 in the brief repeat this requirement.'),
('Add/update data','Vehicle forms and custom-table forms save records to MySQL.'),
('Delete records','Custom-table rows can be physically deleted. Vehicle removal archives assets to preserve rental history.'),
('Remove a table','An administrator types the custom table name to confirm DROP TABLE. Core tables are protected.'),
('Minimum four reports','Booking value, fleet status, booking status and top vehicles, each downloadable as PDF. The full summary is additional.'),
('System overview','Pages 1-2 describe the service setting, roles and architecture.'),
('ER model and tables','Page 3 lists all core tables. Pages 12-14 represent all 24 foreign-key relationships across the 21 core entities.'),
('UNF to 3NF','Pages 10-11 show the decomposition process, dependencies and implementation exceptions.')],[128,371])
sub('Presentation readiness')
body('Table creation/removal needs the dedicated app account to have CREATE and DROP privileges. Run scripts/enable-table-management.ps1 locally, then scripts/verify-table-management.mjs. On the development computer, the permissions were enabled and the automated create/insert/update/delete/drop cycle passed on 1 October 2026, including admin-only access and core-table protection. Other installations still require the permission step.')
sub('Group and submission requirements')
body('The brief calls for five members, including at least one student from each of ICT, Data Science and Computer Science. Member names, student numbers and streams have not been supplied. Add these before submission. Submit the report and system through Moodle on 12 October 2026; GitHub is not Moodle submission. Presentations are listed for 11-12 October, 09:00-17:00; confirm the group slot with the lecturer.')

page(10,'Normalization: UNF to 2NF')
body('This worked design example starts from a hypothetical rental worksheet, not actual customer records. A booking may contain multiple extras, and a vehicle may have several features and photographs. Braces below represent repeating groups, not SQL columns.')
sub('Unnormalized form (UNF)')
code('RENTAL_SHEET(BookingID, CustomerID, CustomerName, Email,\n  VehicleID, Registration, ModelID, ModelName, CategoryID,\n  CategoryName, BranchID, CityID, CityName, ProvinceID,\n  ProvinceName, StartDate, EndDate, AppliedRate,\n  {ExtraID, ExtraName, UnitPrice, Quantity},\n  {FeatureID, FeatureName}, {ImageID, ImageURL})')
body('Repeating extras, features and images prevent a single atomic value in each cell. Repeating customer, vehicle and location descriptions also produces update, insertion and deletion anomalies: changing one city name would require editing many rental rows.')
sub('First normal form (1NF): remove repeating groups')
body('Create one BookingFlat row per BookingID and separate atomic relations: BookingExtraFlat(BookingID, ExtraID, ExtraName, UnitPrice, Quantity); VehicleFeatureFlat(VehicleID, FeatureID, FeatureName); and VehicleImage(ImageID, VehicleID, ImageURL). Candidate keys for the two association relations are their paired identifiers. Values are atomic, but partial and transitive dependencies remain.')
sub('Functional dependencies used')
code('BookingID -> CustomerID, VehicleID, dates, AppliedRate\nCustomerID -> CustomerName, Email\nVehicleID -> Registration, ModelID, BranchID\nModelID -> ModelName, CategoryID\nCategoryID -> CategoryName\nBranchID -> CityID; CityID -> CityName, ProvinceID\nProvinceID -> ProvinceName\nExtraID -> current ExtraName, current Price\n(BookingID, ExtraID) -> historical UnitPrice, Quantity\nFeatureID -> FeatureName')
sub('Second normal form (2NF): remove partial dependencies')
body('In VehicleFeatureFlat, FeatureName depends only on FeatureID, not on the full (VehicleID, FeatureID) key. Move the name to Feature and retain VehicleFeature(VehicleID, FeatureID). In BookingExtraFlat, move the current extra definition to RentalExtra; retain the booking-specific quantity and historical unit price in BookingExtra. The remaining non-key attributes in these association relations depend on the whole candidate key.')
body('BookingFlat has a single-column key, so it has no partial-key dependency; it can still violate 3NF through transitive dependencies. That is addressed next.')

page(11,'Normalization: 3NF & implementation')
sub('Third normal form (3NF): remove transitive dependencies')
body('Split current descriptive facts from BookingFlat: Customer owns profile details; Vehicle owns registration and asset details; VehicleModel owns brand/model/category; VehicleCategory owns its name; Branch owns its city reference; City owns its province reference; Province owns its name. Booking refers to the customer, vehicle and pickup/return branches instead of using their current descriptions as authoritative data.')
table(['Normalized relation','Key dependency'],[
('Customer','customer_id -> current name, email, phone and licence details'),
('Vehicle / VehicleModel','vehicle_id -> model_id, branch_id, registration, asset attributes; model_id -> brand, model_name, category_id'),
('VehicleCategory','category_id -> category_name'),
('Branch / City / Province','branch_id -> branch attributes, city_id; city_id -> city_name, province_id; province_id -> province_name'),
('Feature / VehicleFeature','feature_id -> feature_name; association key is (vehicle_id, feature_id)'),
('RentalExtra / BookingExtra','extra_id -> current extra definition; (booking_id, extra_id) -> selected quantity and price at booking'),
('Booking','booking_id -> customer_id, vehicle_id, branch references, dates and agreed rental rate')],[142,357])
sub('Lossless reconstruction and integrity')
body('Each separated entity retains its primary key, and referencing relations retain foreign keys. Joining an association to a referenced primary/unique key reconstructs its descriptions without multiplying rows unexpectedly. Unique business identifiers, such as registration_no and extra_code, prevent duplicate definitions. The complete implemented schema extends this core with account/session, payment, cancellation, email and review entities.')
sub('Physical exceptions must be explained')
body('The physical implementation deliberately stores historical name/email snapshots in Booking and an extra-name snapshot in BookingExtra. These record the agreed facts at reservation time, rather than the current profile/catalogue value. Generated subtotals and total_cost, plus the transaction-maintained extras_total, also materialize derived values. They are not an unqualified claim that every stored physical attribute is strict 3NF.')
body('The normalized logical decomposition above satisfies the teaching process; the group should explain the historical/derived implementation exceptions to the lecturer. If the lecturer requires a strictly normalized physical schema with no such materialization, these columns require a separate migration and application refactor. User-created tables must also be designed with appropriate dependencies; the table builder does not automatically prove 3NF.')

# Parse every actual FK from the supplied DDL, including nullable and unique links.
sql=(ROOT/'database/Database_Updated.sql').read_text(encoding='utf-8')
edges=[]
for match in re.finditer(r'CREATE TABLE (\w+) \((.*?)\) ENGINE=InnoDB;',sql,re.S):
    child,definition=match.groups()
    for fk in re.finditer(r'FOREIGN KEY \((\w+)\) REFERENCES (\w+)\((\w+)\)',definition):
        col,parent,pk=fk.groups()
        coldef=re.search(r'^\s*'+col+r'\s+([^\n]+)',definition,re.M).group(1)
        parent_card='1' if 'NOT NULL' in coldef else '0..1'
        child_card='0..1' if 'UNIQUE' in coldef else '0..N'
        edges.append((parent,pk,parent_card,child,col,child_card))
assert len(edges)==24

class ERPanels(Flowable):
    def __init__(self,items):Flowable.__init__(self);self.width=499;self.height=len(items)*66;self.items=items
    def draw(self):
        c=self.canv
        for i,(parent,pk,pc,child,fk,cc) in enumerate(self.items):
            y=self.height-(i+1)*66+10
            for x,name,key in [(0,parent,'PK: '+pk),(309,child,'FK: '+fk)]:
                c.setFillColor(colors.HexColor('#f5f5f7'));c.setStrokeColor(colors.HexColor('#dce1e7'));c.roundRect(x,y,190,45,7,stroke=1,fill=1)
                c.setFillColor(INK);c.setFont('Helvetica-Bold',10);c.drawString(x+10,y+28,name)
                c.setFont('Helvetica',8);c.drawString(x+10,y+12,key)
            c.setStrokeColor(BLUE);c.line(190,y+22,309,y+22)
            c.setFillColor(INK);c.setFont('Helvetica',9);c.drawString(200,y+29,pc);c.drawRightString(300,y+29,cc)

for i in range(3):
    page(12+i,f'Complete ER model / {i+1} of 3')
    body('These relationship panels collectively show every foreign key in the 21-table core schema. Repeated boxes denote the same entity. The full field definitions are in database/Database_Updated.sql; the table inventory is on page 3.')
    body('Read left to right: parent entity and referenced primary key, then child entity and foreign key. 1 means exactly one; 0..1 means optional one; 0..N means zero or many. Each child row references the parent with the indicated optionality. Custom administrator-created tables are independent additions.')
    story.append(ERPanels(edges[i*8:(i+1)*8]))
    story.append(p(f'Relationships {i*8+1}-{(i+1)*8} of 24. Generated from the implemented CREATE TABLE definitions.','SmallDrift'))

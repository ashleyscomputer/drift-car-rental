export type SchemaColumn = {
  name: string;
  type: string;
  nullable: string;
  defaultValue: string | null;
  key: string;
  extra: string;
};
export type SchemaRelation = {
  name: string;
  table: string;
  column: string;
  targetTable: string;
  targetColumn: string;
  updateRule: string;
  deleteRule: string;
};
export type SchemaIndex = {
  name: string;
  column: string;
  unique: number;
  position: number;
};
export type SchemaTable = {
  name: string;
  engine: string;
  rows: number;
  columns: SchemaColumn[];
  indexes: SchemaIndex[];
  checks: { name: string; clause: string }[];
  ddl: string;
};
export type DatabaseSchema = {
  database: string;
  version: string;
  capturedAt: string;
  tables: SchemaTable[];
  relations: SchemaRelation[];
};

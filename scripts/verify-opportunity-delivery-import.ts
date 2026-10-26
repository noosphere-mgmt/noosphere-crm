import assert from "node:assert/strict";
import { getImportObjectDefinition } from "../lib/import/objectRegistry";
import * as database from "../lib/db";
import * as businessIds from "../lib/businessIdResolve";
import { getTemplateForObject, exportObjectCsv } from "../lib/import/templates";
import { todayServiceDate } from "../lib/opportunityDelivery";

const def = getImportObjectDefinition("opportunities");
const db = database as { query: (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]> };
const ids = businessIds as unknown as Record<string, unknown>;
const originalQuery = db.query;
const originalIds = { allocateNextBusinessId:ids.allocateNextBusinessId, registerBusinessId:ids.registerBusinessId, ensureLegacyBusinessId:ids.ensureLegacyBusinessId };
const writes: Array<{sql:string; params:unknown[]}> = [];

async function main() {
  const status = def.fields.find(f=>f.key === "service_delivery_status")!;
  const date = def.fields.find(f=>f.key === "service_due_date")!;
  assert.equal(status.label,"Service Delivery");
  assert.equal(date.label,"Due/Complete");
  assert.equal(date.type,"date");
  for(const [label,value] of [["N/A","not_started"],["In Progress","in_progress"],["Completed","completed"]]) {
    assert.equal(status.normalizeValue?.(label),value);
    assert.ok(status.enumValues?.includes(value));
  }
  const template = getTemplateForObject("opportunities");
  assert.ok(template.split("\n")[0].includes("service_delivery_status,service_due_date"));
  assert.ok(template.includes("N/A"));
  ids.allocateNextBusinessId = async()=>"test-only-opportunity";
  ids.registerBusinessId = async()=>{};
  ids.ensureLegacyBusinessId = async()=>{};
  db.query = async(sql,params=[])=>{
    writes.push({sql,params});
    if(sql.includes("INSERT INTO opportunities")) return [{id:"123"}];
    return [];
  };
  for(const delivery of ["not_started","in_progress","completed"]) {
    writes.length=0;
    await def.createRecord({opportunity_name:"Import check",status:"closed_won",service_delivery_status:delivery,service_due_date:"2026-10-20"},{});
    const insert=writes.find(w=>w.sql.includes("INSERT INTO opportunities"))!;
    assert.equal(insert.params[26],delivery);
    assert.equal(insert.params[27],"2026-10-20");
    assert.equal(insert.params.length,28);
  }
  writes.length=0;
  await def.updateRecord(123,{service_delivery_status:"completed",service_due_date:"2026-10-20"},{existing:{id:123,values:{status:"closed_won",service_delivery_status:"in_progress"}}});
  assert.ok(writes[0].sql.includes("service_delivery_status"));
  assert.ok(writes[0].params.includes("2026-10-20"));
  writes.length=0;
  await def.updateRecord(123,{opportunity_name:"Old file without new columns"},{});
  assert.ok(!writes[0].sql.includes("service_delivery_status"));
  assert.ok(!writes[0].sql.includes("service_due_date"));
  writes.length=0;
  await def.updateRecord(123,{service_delivery_status:"completed"},{existing:{id:123,values:{status:"closed_won",service_delivery_status:"in_progress"}}});
  assert.ok(writes[0].params.includes(todayServiceDate()));
  writes.length=0;
  await def.createRecord({opportunity_name:"Non-won",status:"sourcing",service_delivery_status:"completed"},{});
  assert.equal(writes.find(w=>w.sql.includes("INSERT INTO opportunities"))!.params[26],"not_started");
  writes.length=0;
  await def.updateRecord(123,{status:"closed_lost"},{existing:{id:123,values:{status:"closed_won",service_delivery_status:"completed"}}});
  assert.ok(writes[0].params.includes("not_started"));
  db.query = async()=>[{legacy_id:"123",opportunity_id:"test-only-opportunity",service_delivery_status:"completed",service_due_date:"2026-10-20"}];
  const csv=await exportObjectCsv("opportunities");
  assert.ok(csv.split("\n")[0].includes("service_delivery_status,service_due_date"));
  assert.ok(csv.includes("completed,2026-10-20"));
  db.query = async()=>[{legacy_id:"123",opportunity_id:"test-only-opportunity",service_delivery_status:"not_started",service_due_date:null}];
  assert.ok((await exportObjectCsv("opportunities")).includes("N/A"));
  console.log("OK delivery import/export/template: status labels, dates, create/update, historical dates, completion default, and old-file preservation");
}
main().catch(err=>{console.error(err);process.exitCode=1;}).finally(()=>{db.query=originalQuery;Object.assign(ids,originalIds);});

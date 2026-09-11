import type { BuildingMergeFieldRow } from "@/lib/buildingMergeFields";
import type { PropertyV1 } from "@/lib/repos/propertiesV1";

export type BuildingMergeImpact = {
  premises: number;
  opportunities: number;
  occupants: number;
  activities: number;
  companies: number;
  contacts: number;
  proposalItems: number;
  documents: number;
  relationshipLines: number;
  leaseRecords: number;
};

export type BuildingMergeParticipant = {
  property: PropertyV1;
  impact: BuildingMergeImpact;
};

export type BuildingMergePreview = {
  buildings: BuildingMergeParticipant[];
  fields: BuildingMergeFieldRow[];
  defaultSurvivorId: string;
  addedRelationshipLines: number;
};

export function emptyMergeImpact(): BuildingMergeImpact {
  return {
    premises: 0,
    opportunities: 0,
    occupants: 0,
    activities: 0,
    companies: 0,
    contacts: 0,
    proposalItems: 0,
    documents: 0,
    relationshipLines: 0,
    leaseRecords: 0,
  };
}

export function sumMergeImpact(impacts: BuildingMergeImpact[]): BuildingMergeImpact {
  return impacts.reduce(
    (acc, item) => ({
      premises: acc.premises + item.premises,
      opportunities: acc.opportunities + item.opportunities,
      occupants: acc.occupants + item.occupants,
      activities: acc.activities + item.activities,
      companies: acc.companies + item.companies,
      contacts: acc.contacts + item.contacts,
      proposalItems: acc.proposalItems + item.proposalItems,
      documents: acc.documents + item.documents,
      relationshipLines: acc.relationshipLines + item.relationshipLines,
      leaseRecords: acc.leaseRecords + item.leaseRecords,
    }),
    emptyMergeImpact(),
  );
}

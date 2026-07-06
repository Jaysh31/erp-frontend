// export type LeadStatus =
//   | "Lead"
//   | "Contacted"
//   | "Qualified"
//   | "Unqualified"
//   | "Converted";

// export interface LeadRecord {
//   id: string;

//   firstName: string;
//   lastName: string;
//   organizationName: string;
//   jobTitle: string;

//   status: LeadStatus;
//   leadType: string;
//   source: string;

//   email: string;
//   mobileNo: string;

//   city: string;
//   country: string;

//   createdOn: string;
//   phone: string;
//   website: string;

//   industry: string;
//   employees: string;
//   annualRevenue: string;

//   state: string;

//   qualificationStatus: string;
//   qualifiedBy: string;
//   qualifiedOn: string;
// }

// const STORAGE_KEY = "erp_leads";

// function getStorage(): LeadRecord[] {
//   const data = localStorage.getItem(STORAGE_KEY);
//   return data ? JSON.parse(data) : [];
// }

// function saveStorage(data: LeadRecord[]) {
//   localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
// }

// export function getAllLeads(): LeadRecord[] {
//   return getStorage();
// }

// export function getLeadById(id: string): LeadRecord | undefined {
//   return getStorage().find((lead) => lead.id === id);
// }

// export function createLead(
//   lead: Omit<LeadRecord, "id" | "createdOn">
// ): LeadRecord {
//   const leads = getStorage();

//   const newLead: LeadRecord = {
//     ...lead,
//     id: `LEAD-${Date.now()}`,
//     createdOn: new Date().toISOString(),
//   };

//   leads.unshift(newLead);

//   saveStorage(leads);

//   return newLead;
// }

// export function updateLead(
//   id: string,
//   updatedData: Partial<LeadRecord>
// ): LeadRecord {
//   const leads = getStorage();

//   const index = leads.findIndex((l) => l.id === id);

//   if (index === -1) {
//     throw new Error("Lead not found");
//   }

//   leads[index] = {
//     ...leads[index],
//     ...updatedData,
//   };

//   saveStorage(leads);

//   return leads[index];
// }

// export function deleteLead(id: string): void {
//   const leads = getStorage().filter((lead) => lead.id !== id);

//   saveStorage(leads);
// }
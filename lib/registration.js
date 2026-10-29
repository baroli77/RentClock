// Official rollout guidance checked 29 October 2026. Property location controls
// the mandatory deadline; all regions can register from 15 December 2026.
export const REGISTRATION_SOURCE = "https://www.gov.uk/guidance/register-your-rental-property-service-guidance-for-landlords";
export const REGISTRATION_LAUNCH = "2026-12-15";
export const REGISTRATION_REGIONS = [
  { id: "west-midlands", name: "West Midlands", starts: "2026-12-15", deadline: "2027-03-14" },
  { id: "east-of-england", name: "East of England", starts: "2027-01-15", deadline: "2027-04-14" },
  { id: "east-midlands", name: "East Midlands", starts: "2027-02-15", deadline: "2027-05-14" },
  { id: "south-east", name: "South East", starts: "2027-03-15", deadline: "2027-06-14" },
  { id: "yorkshire-and-humber", name: "Yorkshire and Humber", starts: "2027-04-15", deadline: "2027-07-14" },
  { id: "north-west", name: "North West", starts: "2027-05-15", deadline: "2027-08-14" },
  { id: "north-east", name: "North East", starts: "2027-06-15", deadline: "2027-09-14" },
  { id: "london", name: "London", starts: "2027-07-15", deadline: "2027-10-14" },
  { id: "south-west", name: "South West", starts: "2027-08-15", deadline: "2027-11-14" },
];
export function registrationDeadline(regionId) {
  return REGISTRATION_REGIONS.find((region) => region.id === regionId) || null;
}

# County property/tax sites (7-county Twin Cities metro)

Starting points, checked 2026-09-25. Use them for `annualTaxes` (current taxes payable), `taxYear`, `ownerName`, and to confirm sqft, year built, and last sale. Put the parcel page URL in `subject.countyUrl`. If a site is down, try the GIS viewer, then tell Emily which field you couldn't confirm.

Outside these 7 counties: stop and tell Emily.

| County | Property search | GIS viewer | How to use |
|---|---|---|---|
| Hennepin | https://www16.co.hennepin.mn.us/pins/ | https://gis.hennepin.us/property/ | Search by address or 13-digit PID. "Parcel Data for Taxes Payable <year>" shows Total net tax and owner/taxpayer. Terms ban bots: look up one parcel at a time, like a person. |
| Ramsey | https://beacon.schneidercorp.com/application.aspx?app=RamseyCountyMN&PageType=Search | https://maps.co.ramsey.mn.us/MapRamsey/ | Beacon (county vendor). Accept the terms popup. Search by address, PIN, or owner. Taxes on the parcel's Property Tax section. Landing page: https://www.ramseycountymn.gov/residents/property-home/property-tax-value-lookup |
| Dakota | https://gis.co.dakota.mn.us/PropertyInformation/ | same | Map app. Accept the disclaimer, type the house number and pick from the list, or enter the PID with no dashes. Shows owner and total tax, plus tax statements. |
| Anoka | https://prtpublicweb.co.anoka.mn.us/ | https://gis.anokacountymn.gov/propertysearch/ | Accept the disclaimer. Search by address or PIN. Taxes: Reports, duplicate tax statement, GO (allow pop-ups). Help: https://www.anokacountymn.gov/4660 |
| Washington | https://mn-washington.publicaccessnow.com/TaxSearch.aspx | https://experience.arcgis.com/experience/a0a1cb63cd7846bea9ff6c8e18b9b48c | Address = number + street name only (leave off "St"/"Ave"). PIN format 11.022.33.44.0001. Account page has tax bills and statements. Property details: https://washington.minnesotaassessors.com/ . GIS viewer has owner and value but no tax amount. |
| Scott | https://www2.co.scott.mn.us/propertyinfo/searchpropertyinfo_criteria.aspx | https://gis.co.scott.mn.us/sg3/ | Search by 9-digit PID or by address, not both. Defaults to the current payable year. Alternate: https://publicaccess.scottcountymn.gov (disclaimer). |
| Carver | https://gis.carvercountymn.gov/property/ | same | Map app with taxpayer name and total tax. Tax detail: https://publicaccess.carvercountymn.gov . The old manatron.com address is dead. |

## Tips
- "Taxes payable <year>" is what you want for `annualTaxes`; `taxYear` is that payable year.
- Owner match: compare `ownerName` to the contact's name. Married couples, trusts, and estates count as a match if the contact is one of them; say so to Emily. A clear mismatch (different person, LLC, bank) means `ownerConfirmed: false` and a heads-up to Emily.
- Homestead status on the county page is useful context: non-homestead often means a rental or vacant house.

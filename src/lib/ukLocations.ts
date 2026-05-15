export const LOCATION_POSTCODE: Record<string, string> = {
  'Barking and Dagenham': 'RM8', Barnet: 'EN5', Bexley: 'DA5', Brent: 'HA9', Bromley: 'BR1',
  Camden: 'NW1', 'City of London': 'EC1A', Croydon: 'CR0', Ealing: 'W5', Enfield: 'EN1',
  Greenwich: 'SE10', Hackney: 'E8', 'Hammersmith and Fulham': 'W6', Haringey: 'N4', Harrow: 'HA1',
  Havering: 'RM1', Hillingdon: 'UB8', Hounslow: 'TW3', Islington: 'N1', 'Kensington and Chelsea': 'SW3',
  'Kingston upon Thames': 'KT1', Lambeth: 'SE1', Lewisham: 'SE13', Merton: 'SW19', Newham: 'E6',
  Redbridge: 'IG1', 'Richmond upon Thames': 'TW9', Southwark: 'SE1', Sutton: 'SM1', 'Tower Hamlets': 'E1',
  'Waltham Forest': 'E17', Wandsworth: 'SW18', Westminster: 'SW1A',
  Birmingham: 'B1', Bristol: 'BS1', Cambridge: 'CB1', Cardiff: 'CF10', Coventry: 'CV1',
  Edinburgh: 'EH1', Glasgow: 'G1', Leeds: 'LS1', Leicester: 'LE1', Liverpool: 'L1',
  Manchester: 'M1', 'Newcastle upon Tyne': 'NE1', Nottingham: 'NG1', Oxford: 'OX1',
  Reading: 'RG1', Sheffield: 'S1', Southampton: 'SO14', York: 'YO1',
};

export const UK_LOCATIONS: { group: string; items: string[] }[] = [
  {
    group: 'London Boroughs',
    items: [
      'Barking and Dagenham', 'Barnet', 'Bexley', 'Brent', 'Bromley',
      'Camden', 'City of London', 'Croydon', 'Ealing', 'Enfield',
      'Greenwich', 'Hackney', 'Hammersmith and Fulham', 'Haringey', 'Harrow',
      'Havering', 'Hillingdon', 'Hounslow', 'Islington', 'Kensington and Chelsea',
      'Kingston upon Thames', 'Lambeth', 'Lewisham', 'Merton', 'Newham',
      'Redbridge', 'Richmond upon Thames', 'Southwark', 'Sutton', 'Tower Hamlets',
      'Waltham Forest', 'Wandsworth', 'Westminster',
    ],
  },
  {
    group: 'Major Cities',
    items: [
      'Birmingham', 'Bristol', 'Cambridge', 'Cardiff', 'Coventry',
      'Edinburgh', 'Glasgow', 'Leeds', 'Leicester', 'Liverpool',
      'Manchester', 'Newcastle upon Tyne', 'Nottingham', 'Oxford',
      'Reading', 'Sheffield', 'Southampton', 'York',
    ],
  },
];

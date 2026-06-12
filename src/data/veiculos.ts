export interface MarcaModelo {
  marca: string
  modelos: string[]
}

export const MARCAS_MODELOS: MarcaModelo[] = [
  {
    marca: 'Chevrolet',
    modelos: ['Onix', 'Onix Plus', 'Tracker', 'Cruze', 'Spin', 'S10', 'Trailblazer', 'Equinox', 'Montana', 'Blazer', 'Prisma', 'Cobalt', 'Agile', 'Classic', 'Celta', 'Corsa', 'Corsa Sedan', 'Astra', 'Vectra', 'Zafira', 'Captiva', 'Silverado', 'Trax', 'Camaro', 'Corvette'],
  },
  {
    marca: 'Fiat',
    modelos: ['Argo', 'Cronos', 'Pulse', 'Fastback', 'Toro', 'Strada', 'Mobi', 'Uno', 'Palio', 'Siena', 'Punto', 'Bravo', 'Linea', 'Grand Siena', 'Doblo', 'Fiorino', 'Ducato', '500', 'Tipo', 'Freemont', '147', 'Marea', 'Brava', 'Tempra', 'Stilo'],
  },
  {
    marca: 'Volkswagen',
    modelos: ['Gol', 'Polo', 'Virtus', 'T-Cross', 'Nivus', 'Taos', 'Tiguan', 'Amarok', 'Saveiro', 'Fox', 'Voyage', 'Golf', 'Jetta', 'Passat', 'Touareg', 'Up!', 'Crossfox', 'SpaceFox', 'SpaceCross', 'Parati', 'Santana', 'Corrado', 'Fusca'],
  },
  {
    marca: 'Ford',
    modelos: ['Ka', 'Ka Sedan', 'EcoSport', 'Territory', 'Edge', 'Ranger', 'Maverick', 'F-150', 'F-250', 'Fiesta', 'Focus', 'Fusion', 'Bronco', 'Explorer', 'Expedition', 'Mustang', 'Bronco Sport', 'Transit', 'Cargo'],
  },
  {
    marca: 'Toyota',
    modelos: ['Corolla', 'Corolla Cross', 'Yaris', 'Hilux', 'SW4', 'RAV4', 'Camry', 'Prius', 'Land Cruiser', 'Prado', 'Fortuner', 'Etios', 'Fielder', 'Avalon', '4Runner', 'Tundra', 'Tacoma', 'Venza', 'Sequoia'],
  },
  {
    marca: 'Honda',
    modelos: ['Civic', 'City', 'City Hatch', 'HR-V', 'CR-V', 'WR-V', 'Fit', 'Jazz', 'Accord', 'Pilot', 'Ridgeline', 'Passport', 'Odyssey', 'Element', 'CR-Z', 'S2000'],
  },
  {
    marca: 'Hyundai',
    modelos: ['HB20', 'HB20S', 'HB20X', 'Creta', 'Tucson', 'Santa Fe', 'ix35', 'Azera', 'Sonata', 'Elantra', 'Veloster', 'Genesis', 'i30', 'Kona', 'Venue', 'Ioniq'],
  },
  {
    marca: 'Jeep',
    modelos: ['Renegade', 'Compass', 'Commander', 'Wrangler', 'Cherokee', 'Grand Cherokee', 'Gladiator', 'Meridian'],
  },
  {
    marca: 'Renault',
    modelos: ['Kwid', 'Sandero', 'Logan', 'Duster', 'Captur', 'Oroch', 'Stepway', 'Megane', 'Scenic', 'Clio', 'Fluence', 'Koleos', 'Arkana', 'Master'],
  },
  {
    marca: 'Nissan',
    modelos: ['March', 'Versa', 'Kicks', 'Sentra', 'Tiida', 'Livina', 'Frontier', 'X-Trail', 'Murano', 'Pathfinder', 'Altima', 'Maxima', '370Z', 'GT-R'],
  },
  {
    marca: 'Peugeot',
    modelos: ['208', '308', '3008', '5008', '2008', '408', 'Partner', 'Expert', 'Boxer', '207', '207 SW', '301', '307', '308 SW', '407', '508'],
  },
  {
    marca: 'Citroën',
    modelos: ['C3', 'C4', 'C4 Cactus', 'C4 Picasso', 'C5', 'Aircross', 'Berlingo', 'Jumpy', 'Jumper', 'C3 Aircross', 'DS3', 'DS4', 'DS5'],
  },
  {
    marca: 'Mitsubishi',
    modelos: ['ASX', 'Outlander', 'Eclipse Cross', 'Pajero', 'Pajero Full', 'L200 Triton', 'Lancer', 'Galant', 'Colt', 'Space Star', 'i-MiEV'],
  },
  {
    marca: 'Kia',
    modelos: ['Sportage', 'Sorento', 'Stinger', 'Cerato', 'Rio', 'Soul', 'Cadenza', 'Carnival', 'Telluride', 'Niro', 'EV6', 'Stonic', 'Seltos'],
  },
  {
    marca: 'BMW',
    modelos: ['118i', '120i', '130i', '316i', '318i', '320i', '325i', '328i', '330i', '335i', '418i', '420i', '428i', '430i', '440i', '520i', '525i', '528i', '530i', '535i', '540i', '550i', '630i', '640i', '650i', '730i', '740i', '750i', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'M2', 'M3', 'M4', 'M5', 'M6', 'M8', 'Z3', 'Z4', 'i3', 'i4', 'i8', 'iX'],
  },
  {
    marca: 'Mercedes-Benz',
    modelos: ['A 200', 'A 250', 'B 200', 'C 180', 'C 200', 'C 250', 'C 300', 'C 43 AMG', 'C 63 AMG', 'E 200', 'E 250', 'E 300', 'E 400', 'E 63 AMG', 'S 400', 'S 450', 'S 500', 'S 63 AMG', 'CLA 200', 'CLA 250', 'GLA 200', 'GLC 250', 'GLC 300', 'GLE 400', 'GLS 500', 'AMG GT', 'SL 400', 'SLC 300', 'Sprinter', 'Vito', 'Classe X'],
  },
  {
    marca: 'Audi',
    modelos: ['A1', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q2', 'Q3', 'Q5', 'Q7', 'Q8', 'TT', 'R8', 'RS3', 'RS4', 'RS5', 'RS6', 'RS7', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'e-tron'],
  },
  {
    marca: 'Volvo',
    modelos: ['S60', 'S90', 'V40', 'V60', 'V90', 'XC40', 'XC60', 'XC90', 'C30', 'C70'],
  },
  {
    marca: 'Land Rover',
    modelos: ['Defender', 'Discovery', 'Discovery Sport', 'Freelander', 'Range Rover', 'Range Rover Sport', 'Range Rover Velar', 'Range Rover Evoque'],
  },
  {
    marca: 'Subaru',
    modelos: ['Impreza', 'Legacy', 'Outback', 'Forester', 'XV', 'WRX', 'BRZ', 'Ascent', 'Crosstrek'],
  },
  {
    marca: 'Suzuki',
    modelos: ['Swift', 'Vitara', 'Jimny', 'Grand Vitara', 'SX4', 'Ignis', 'Baleno', 'S-Cross'],
  },
  {
    marca: 'Caoa Chery',
    modelos: ['Tiggo 2', 'Tiggo 3X', 'Tiggo 5X', 'Tiggo 7', 'Tiggo 7 Pro', 'Tiggo 8', 'Tiggo 8 Pro', 'Arrizo 6', 'Arrizo 5'],
  },
  {
    marca: 'BYD',
    modelos: ['Dolphin', 'King', 'Han', 'Tang', 'Seal', 'Song', 'Yuan Plus', 'Atto 3', 'Destroyer 05'],
  },
  {
    marca: 'GWM / Haval',
    modelos: ['H6', 'H2', 'H2S', 'H4', 'F7', 'F7x', 'Jolion', 'Ora 03', 'Poer'],
  },
  {
    marca: 'JAC',
    modelos: ['J3', 'J5', 'T6', 'T8', 'E-JS1', 'iEV40', 'Sei 4'],
  },
  {
    marca: 'Lifan',
    modelos: ['320', '520', '620', 'X60', 'X70', 'Foison'],
  },
  {
    marca: 'RAM',
    modelos: ['700', '1000', '1500', '2500', '3500', 'ProMaster'],
  },
  {
    marca: 'Dodge',
    modelos: ['Challenger', 'Charger', 'Durango', 'Journey'],
  },
  {
    marca: 'Jeep (Importado)',
    modelos: ['Wrangler Rubicon', 'Grand Cherokee L', 'Gladiator Rubicon'],
  },
  {
    marca: 'Porsche',
    modelos: ['911', 'Macan', 'Cayenne', 'Panamera', 'Taycan', 'Boxster', 'Cayman'],
  },
  {
    marca: 'Lamborghini',
    modelos: ['Huracán', 'Urus', 'Aventador'],
  },
  {
    marca: 'Ferrari',
    modelos: ['F8', 'Roma', 'SF90', 'Portofino', '296 GTB', 'GTC4Lusso'],
  },
  {
    marca: 'Maserati',
    modelos: ['Ghibli', 'Levante', 'Quattroporte', 'GranTurismo'],
  },
  {
    marca: 'Lexus',
    modelos: ['CT 200h', 'ES 300h', 'IS 300', 'LS 500', 'NX 300', 'RX 350', 'UX 250h', 'LX 570'],
  },
  {
    marca: 'Alfa Romeo',
    modelos: ['Giulia', 'Stelvio', 'Giulietta', '4C', 'Tonale'],
  },
  {
    marca: 'Dodge / Chrysler',
    modelos: ['300C', 'Dart', 'Neon'],
  },
  {
    marca: 'Volkswagen (Importado)',
    modelos: ['Touareg', 'Phaeton', 'Sharan'],
  },
]

export const TODAS_MARCAS = MARCAS_MODELOS.map(m => m.marca)

export function getModelos(marca: string): string[] {
  return MARCAS_MODELOS.find(m => m.marca === marca)?.modelos || []
}

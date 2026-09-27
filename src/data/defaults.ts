export const DEFAULT_GOVERNORATES = [
  'Cairo', 'Giza', 'Alexandria', 'Dakahlia', 'Red Sea', 'Beheira',
  'Fayoum', 'Gharbiya', 'Ismailia', 'Menofia', 'Minya', 'Qaliubiya',
  'New Valley', 'Suez', 'Aswan', 'Assiut', 'Beni Suef', 'Port Said',
  'Damietta', 'Sharkia', 'South Sinai', 'Kafr Al sheikh', 'Matrouh',
  'Luxor', 'Qena', 'North Sinai', 'Sohag',
];

export const DEFAULT_SHIPPING_RATES: Record<string, number> = {
  Cairo: 85, Giza: 85, Qaliubiya: 70, Alexandria: 130, Suez: 130,
  Beheira: 140, Ismailia: 140, 'Port Said': 140, Damietta: 140,
  Dakahlia: 140, Gharbiya: 140, 'Kafr Al sheikh': 140, Fayoum: 140,
  'Beni Suef': 140, Menofia: 100, Sharkia: 100, Matrouh: 180,
  Minya: 160, Assiut: 160, Sohag: 160, Qena: 160, Luxor: 160,
  Aswan: 160, 'North Sinai': 200, 'South Sinai': 200, 'Red Sea': 200,
  'New Valley': 200,
};

export const DEFAULT_PAYMENT_DETAILS = {
  instapay: { title: 'InstaPay Account', number: '01092748940', note: 'Send the exact order amount to the InstaPay account above, then confirm via WhatsApp.' },
  'vodafone-cash': { title: 'Vodafone Cash Number', number: '01044415982', note: 'Send the exact order amount to the Vodafone Cash number above, then confirm via WhatsApp.' },
};

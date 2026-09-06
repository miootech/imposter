import fs from 'node:fs'

const catNameMap = {
  alltag: 'Everyday Life',
  essen: 'Food',
  getraenke: 'Drinks',
  tiere: 'Animals',
  pflanzen: 'Plants',
  filme: 'Movies',
  serien: 'TV Shows',
  anime: 'Anime',
  videospiele: 'Video Games',
  musik: 'Music',
  promis: 'Celebrities',
  sport: 'Sports',
  berufe: 'Professions',
  kleidung: 'Clothing & Fashion',
  technik: 'Technology',
  fahrzeuge: 'Vehicles',
  laender: 'Countries',
  staedte: 'Cities',
  koerper: 'Body & Anatomy',
  science: 'Science',
  geschichte: 'History',
  geografie: 'Geography',
  wetter: 'Weather',
  weltraum: 'Space & Astronomy',
  schule: 'School',
  uni: 'University',
  haus: 'House & Living',
  moebel: 'Furniture',
  werkzeuge: 'Tools',
  gegenstaende: 'Everyday Objects',
  internet: 'Internet',
  apps: 'Apps & Websites',
  socialmedia: 'Social Media',
  sprichworte: 'Proverbs & Idioms',
  gefuehle: 'Emotions',
  beziehungen: 'Relationships',
  familie: 'Family',
  freunde: 'Friends',
  liebe: 'Love & Romance',
  redflags: 'Red Flags 👀',
  hotakes: 'Hot Takes',
  slang: 'Slang & Gen Z',
  brainrot: 'Brainrot',
  cringe: 'Cringe',
  spicy: 'Spicy 👀',
  freaky: 'Freaky 👀',
  memes: 'Memes & Trends',
  fantasy: 'Fantasy',
  orte: 'Places',
  sportarten: 'Sports Disciplines',
  sportler: 'Athletes',
  buecher: 'Books & Literature',
  sprachen: 'Languages',
  hobbys: 'Hobbies & Leisure',
  marken: 'Brands',
  geschaefte: 'Shops & Stores',
  essensmarken: 'Food Brands',
  modemarken: 'Fashion Brands',
  automarken: 'Car Brands',
  farben: 'Colors',
  formen: 'Shapes & Geometry',
  zahlen: 'Numbers & Math',
  zeit: 'Time & Concepts',
  maerchen: 'Fairy Tales & Fables',
}

// Common German to English translations dictionary for high frequency game words
const dict = {
  // Alltag
  'Zahnbürste': 'Toothbrush', 'Zahnpasta': 'Toothpaste', 'Mundspülung': 'Mouthwash', 'Zahnseide': 'Dental Floss',
  'Zahnspange': 'Braces', 'Kamm': 'Comb', 'Bürste': 'Brush', 'Haargel': 'Hair Gel', 'Haarspray': 'Hairspray',
  'Haarbürste': 'Hairbrush', 'Spiegel': 'Mirror', 'Handspiegel': 'Hand Mirror', 'Kosmetikspiegel': 'Vanity Mirror',
  'Standspiegel': 'Full-length Mirror', 'Handtuch': 'Towel', 'Waschlappen': 'Washcloth', 'Badematte': 'Bath Mat',
  'Duschvorhang': 'Shower Curtain', 'Bademantel': 'Bathrobe', 'Seife': 'Soap', 'Duschgel': 'Shower Gel',
  'Shampoo': 'Shampoo', 'Spülung': 'Conditioner', 'Haarkur': 'Hair Mask', 'Rasierer': 'Razor',
  'Rasierklinge': 'Razor Blade', 'Rasierpinsel': 'Shaving Brush', 'Rasierschaum': 'Shaving Cream',
  'Rasiergel': 'Shaving Gel', 'Rasierwasser': 'Aftershave', 'Deo': 'Deodorant', 'Deodorant': 'Deodorant',
  'Parfüm': 'Perfume', 'Creme': 'Lotion', 'Gesichtscreme': 'Face Cream', 'Handcreme': 'Hand Cream',
  'Körpercreme': 'Body Lotion', 'Fußcreme': 'Foot Cream', 'Tagescreme': 'Day Cream', 'Nachtcreme': 'Night Cream',
  'Feuchtigkeitscreme': 'Moisturizer', 'Augencreme': 'Eye Cream', 'Lippenbalsam': 'Lip Balm', 'Lippenstift': 'Lipstick',
  'Lipgloss': 'Lip Gloss', 'Lipliner': 'Lip Liner', 'Mascara': 'Mascara', 'Wimperntusche': 'Mascara',
  'Eyeliner': 'Eyeliner', 'Lidschatten': 'Eyeshadow', 'Puder': 'Powder', 'Rouge': 'Blush', 'Bronzer': 'Bronzer',
  'Highlighter': 'Highlighter', 'Sonnencreme': 'Sunscreen', 'Sonnenmilch': 'Sun Lotion', 'Sonnenöl': 'Tanning Oil',
  'Badetuch': 'Bath Towel', 'Saunatuch': 'Sauna Towel', 'Strandtuch': 'Beach Towel', 'Schwamm': 'Sponge',
  'Nagelfeile': 'Nail File', 'Nagelknipser': 'Nail Clipper', 'Nagelschere': 'Nail Scissors', 'Nagellack': 'Nail Polish',
  'Nagellackentferner': 'Nail Polish Remover', 'Pinzette': 'Tweezers', 'Wattestäbchen': 'Cotton Swabs',
  'Wattepads': 'Cotton Pads', 'Taschentücher': 'Tissues', 'Klopapier': 'Toilet Paper', 'Toilettenpapier': 'Toilet Paper',
  'Feuchttücher': 'Wet Wipes', 'Taschentuch': 'Handkerchief', 'Brille': 'Glasses', 'Sonnenbrille': 'Sunglasses',
  'Lesebrille': 'Reading Glasses', 'Kontaktlinsen': 'Contact Lenses', 'Linsenbehälter': 'Lens Case',
  'Uhren': 'Watch', 'Armbanduhr': 'Wristwatch', 'Smartwatch': 'Smartwatch', 'Wecker': 'Alarm Clock',
  'Schlüssel': 'Keys', 'Hausschlüssel': 'House Key', 'Autoschlüssel': 'Car Key', 'Schlüsselbund': 'Keychain',
  'Geldbörse': 'Wallet', 'Portemonnaie': 'Wallet', 'Brieftasche': 'Wallet', 'Kreditkarte': 'Credit Card',
  'EC-Karte': 'Debit Card', 'Personalausweis': 'ID Card', 'Führerschein': 'Driver\'s License',
  'Krankenkassenkarte': 'Health Insurance Card', 'Reisepass': 'Passport', 'Fahrkarte': 'Transit Ticket',
  'Monatskarte': 'Monthly Pass', 'Kugelschreiber': 'Ballpoint Pen', 'Bleistift': 'Pencil', 'Füller': 'Fountain Pen',
  'Textmarker': 'Highlighter', 'Notizblock': 'Notepad', 'Kalender': 'Calendar', 'Taschenkalender': 'Planner',
  'Post-it': 'Sticky Note', 'Klebstreifen': 'Tape', 'Schere': 'Scissors', 'Heftklammer': 'Staple',
  'Büroklammer': 'Paperclip', 'Lineal': 'Ruler', 'Radiergummi': 'Eraser', 'Spitzer': 'Pencil Sharpener',
  'Rucksack': 'Backpack', 'Handtasche': 'Handbag', 'Umhängetasche': 'Shoulder Bag', 'Einkaufstasche': 'Shopping Bag',
  'Jutebeutel': 'Tote Bag', 'Koffer': 'Suitcase', 'Reisetasche': 'Duffel Bag', 'Sporttasche': 'Gym Bag',
  'Schirm': 'Umbrella', 'Regenschirm': 'Rain Umbrella', 'Knirps': 'Compact Umbrella', 'Taschenlampe': 'Flashlight',
  'Feuerzeug': 'Lighter', 'Streichhölzer': 'Matches', 'Aschenbecher': 'Ashtray', 'Zigaretten': 'Cigarettes',
  'E-Zigarette': 'Vape', 'Kaugummi': 'Chewing Gum', 'Bonbons': 'Hard Candies', 'Pfefferminz': 'Peppermint',
  'Trinkflasche': 'Water Bottle', 'Thermoskanne': 'Thermos', 'Kaffeebecher': 'Coffee Mug', 'To-Go-Becher': 'To-Go Cup',
  'Tupperdose': 'Lunchbox', 'Brotdose': 'Lunchbox', 'Kopfhörer': 'Headphones', 'In-Ear-Kopfhörer': 'Earbuds',
  'Ladekabel': 'Charging Cable', 'Powerbank': 'Power Bank', 'Handyhülle': 'Phone Case', 'Displayschutzfolie': 'Screen Protector',

  // Essen
  'Pizza': 'Pizza', 'Burger': 'Burger', 'Pommes': 'French Fries', 'Döner': 'Doner Kebab', 'Currywurst': 'Currywurst',
  'Bratwurst': 'Bratwurst', 'Schnitzel': 'Schnitzel', 'Spaghetti': 'Spaghetti', 'Lasagne': 'Lasagna',
  'Pasta': 'Pasta', 'Sushi': 'Sushi', 'Ramen': 'Ramen', 'Tacos': 'Tacos', 'Burrito': 'Burrito',
  'Quesadilla': 'Quesadilla', 'Nachos': 'Nachos', 'Guacamole': 'Guacamole', 'Salsa': 'Salsa',
  'Falafel': 'Falafel', 'Hummus': 'Hummus', 'Schawarma': 'Shawarma', 'Kebab': 'Kebab', 'Baozi': 'Baozi',
  'Dim Sum': 'Dim Sum', 'Frühlingsrolle': 'Spring Roll', 'Pekingente': 'Peking Duck', 'Pad Thai': 'Pad Thai',
  'Curry': 'Curry', 'Butter Chicken': 'Butter Chicken', 'Tikka Masala': 'Tikka Masala', 'Naan': 'Naan',
  'Samosa': 'Samosa', 'Biryani': 'Biryani', 'Gyros': 'Gyros', 'Souvlaki': 'Souvlaki', 'Moussaka': 'Moussaka',
  'Tzatziki': 'Tzatziki', 'Paella': 'Paella', 'Tapas': 'Tapas', 'Croissant': 'Croissant', 'Baguette': 'Baguette',
  'Crêpe': 'Crepe', 'Quiche': 'Quiche', 'Fondue': 'Fondue', 'Raclette': 'Raclette', 'Gulasch': 'Goulash',
  'Pierogi': 'Pierogi', 'Pelmeni': 'Pelmeni', 'Borschtsch': 'Borscht', 'Kumpir': 'Baked Potato',
  'Poutine': 'Poutine', 'Hotdog': 'Hot Dog', 'Sandwich': 'Sandwich', 'Wrap': 'Wrap', 'Toast': 'Toast',
  'Pancakes': 'Pancakes', 'Waffeln': 'Waffles', 'Omelett': 'Omelette', 'Rührei': 'Scrambled Eggs',
  'Spiegelei': 'Fried Egg', 'Müsli': 'Muesli', 'Porridge': 'Porridge', 'Granola': 'Granola',
  'Joghurt': 'Yogurt', 'Quark': 'Quark', 'Käse': 'Cheese', 'Butter': 'Butter', 'Marmelade': 'Jam',
  'Honig': 'Honey', 'Nutella': 'Nutella', 'Schokolade': 'Chocolate', 'Eis': 'Ice Cream', 'Kuchen': 'Cake',
  'Torte': 'Tart', 'Muffin': 'Muffin', 'Donut': 'Donut', 'Cookie': 'Cookie', 'Brownie': 'Brownie',
  'Apfel': 'Apple', 'Banane': 'Banana', 'Orange': 'Orange', 'Erdbeere': 'Strawberry', 'Himbeere': 'Raspberry',
  'Blaubeere': 'Blueberry', 'Wassermelone': 'Watermelon', 'Ananas': 'Pineapple', 'Mango': 'Mango',
  'Pfirsich': 'Peach', 'Weintrauben': 'Grapes', 'Kirsche': 'Cherry', 'Zitrone': 'Lemon', 'Limette': 'Lime',
  'Avocado': 'Avocado', 'Tomate': 'Tomato', 'Gurke': 'Cucumber', 'Karotte': 'Carrot', 'Kartoffel': 'Potato',
  'Zwiebel': 'Onion', 'Knoblauch': 'Garlic', 'Paprika': 'Bell Pepper', 'Brokkoli': 'Broccoli',
  'Spinat': 'Spinach', 'Salat': 'Salad', 'Pilze': 'Mushrooms', 'Mais': 'Corn', 'Reis': 'Rice',

  // Getränke
  'Wasser': 'Water', 'Mineralwasser': 'Sparkling Water', 'Leitungswasser': 'Tap Water', 'Kaffee': 'Coffee',
  'Espresso': 'Espresso', 'Cappuccino': 'Cappuccino', 'Latte Macchiato': 'Latte Macchiato', 'Flat White': 'Flat White',
  'Americano': 'Americano', 'Eiskaffee': 'Iced Coffee', 'Cold Brew': 'Cold Brew', 'Tee': 'Tea',
  'Grüner Tee': 'Green Tea', 'Schwarzer Tee': 'Black Tea', 'Pfefferminztee': 'Peppermint Tea',
  'Kamillentee': 'Chamomile Tea', 'Früchtetee': 'Fruit Tea', 'Eistee': 'Iced Tea', 'Matcha': 'Matcha',
  'Milch': 'Milk', 'Hafermilch': 'Oat Milk', 'Mandelmilch': 'Almond Milk', 'Sojamilch': 'Soy Milk',
  'Kakao': 'Hot Chocolate', 'Heiße Schokolade': 'Hot Chocolate', 'Cola': 'Cola', 'Fanta': 'Orange Soda',
  'Sprite': 'Lemon-Lime Soda', 'Spezi': 'Cola Orange Mix', 'Limonade': 'Lemonade', 'Energy Drink': 'Energy Drink',
  'Red Bull': 'Red Bull', 'Monster': 'Monster Energy', 'Orangensaft': 'Orange Juice', 'Apfelsaft': 'Apple Juice',
  'Apfelschorle': 'Apple Spritzer', 'Smoothie': 'Smoothie', 'Bier': 'Beer', 'Pils': 'Pilsner',
  'Weizenbier': 'Wheat Beer', 'Radler': 'Radler / Shandy', 'Wein': 'Wine', 'Rotwein': 'Red Wine',
  'Weißwein': 'White Wine', 'Rosé': 'Rose Wine', 'Sekt': 'Sparkling Wine', 'Champagner': 'Champagne',
  'Prosecco': 'Prosecco', 'Cocktail': 'Cocktail', 'Mojito': 'Mojito', 'Aperol Spritz': 'Aperol Spritz',
  'Gin Tonic': 'Gin and Tonic', 'Whisky': 'Whiskey', 'Wodka': 'Vodka', 'Rum': 'Rum', 'Tequila': 'Tequila',

  // Tiere
  'Hund': 'Dog', 'Katze': 'Cat', 'Maus': 'Mouse', 'Ratte': 'Rat', 'Hamster': 'Hamster', 'Meerschweinchen': 'Guinea Pig',
  'Kaninchen': 'Rabbit', 'Hase': 'Hare', 'Pferd': 'Horse', 'Esel': 'Donkey', 'Kuh': 'Cow', 'Schaf': 'Sheep',
  'Ziege': 'Goat', 'Schwein': 'Pig', 'Huhn': 'Chicken', 'Hahn': 'Rooster', 'Ente': 'Duck', 'Gans': 'Goose',
  'Truthahn': 'Turkey', 'Löwe': 'Lion', 'Tiger': 'Tiger', 'Leopard': 'Leopard', 'Gepard': 'Cheetah',
  'Jaguar': 'Jaguar', 'Panther': 'Panther', 'Puma': 'Cougar', 'Luchs': 'Lynx', 'Wolf': 'Wolf', 'Fuchs': 'Fox',
  'Bär': 'Bear', 'Braunbär': 'Brown Bear', 'Eisbär': 'Polar Bear', 'Panda': 'Panda', 'Koala': 'Koala',
  'Känguru': 'Kangaroo', 'Elefant': 'Elephant', 'Giraffe': 'Giraffe', 'Zebra': 'Zebra', 'Nilpferd': 'Hippopotamus',
  'Nashorn': 'Rhinoceros', 'Affe': 'Monkey', 'Schimpanse': 'Chimpanzee', 'Gorilla': 'Gorilla',
  'Orang-Utan': 'Orangutan', 'Lemur': 'Lemur', 'Faultier': 'Sloth', 'Gürteltier': 'Armadillo',
  'Ameisenbär': 'Anteater', 'Stachelschwein': 'Porcupine', 'Igel': 'Hedgehog', 'Eichhörnchen': 'Squirrel',
  'Biber': 'Beaver', 'Otter': 'Otter', 'Dachs': 'Badger', 'Marder': 'Marten', 'Wiesel': 'Weasel',
  'Fledermaus': 'Bat', 'Adler': 'Eagle', 'Falke': 'Falcon', 'Habicht': 'Hawk', 'Bussard': 'Buzzard',
  'Eule': 'Owl', 'Uhu': 'Eagle Owl', 'Kauz': 'Tawny Owl', 'Papagei': 'Parrot', 'Wellensittich': 'Budgie',
  'Kakadu': 'Cockatoo', 'Tukan': 'Toucan', 'Kolibri': 'Hummingbird', 'Specht': 'Woodpecker',
  'Taube': 'Pigeon', 'Spatz': 'Sparrow', 'Amsel': 'Blackbird', 'Drossel': 'Thrush', 'Schwalbe': 'Swallow',
  'Krähe': 'Crow', 'Rabe': 'Raven', 'Elster': 'Magpie', 'Möwe': 'Seagull', 'Albatros': 'Albatross',
  'Pelikan': 'Pelican', 'Flamingo': 'Flamingo', 'Storch': 'Stork', 'Kranich': 'Crane', 'Reiher': 'Heron',
  'Pinguin': 'Penguin', 'Strauß': 'Ostrich', 'Emu': 'Emu', 'Pfau': 'Peacock', 'Schwan': 'Swan',
  'Schlange': 'Snake', 'Kobra': 'Cobra', 'Klapperschlange': 'Rattlesnake', 'Python': 'Python',
  'Boa Constrictor': 'Boa Constrictor', 'Anakonda': 'Anaconda', 'Eidechse': 'Lizard', 'Gecko': 'Gecko',
  'Chamäleon': 'Chameleon', 'Leguan': 'Iguana', 'Komodowaran': 'Komodo Dragon', 'Krokodil': 'Crocodile',
  'Alligator': 'Alligator', 'Schildkröte': 'Turtle', 'Landschildkröte': 'Tortoise',
  'Wasserschildkröte': 'Sea Turtle', 'Frosch': 'Frog', 'Kröte': 'Toad', 'Salamander': 'Salamander',
  'Molch': 'Newt', 'Axolotl': 'Axolotl', 'Hai': 'Shark', 'Weißer Hai': 'Great White Shark',
  'Hammerhai': 'Hammerhead Shark', 'Tigerhai': 'Tiger Shark', 'Wal': 'Whale', 'Blauwal': 'Blue Whale',
  'Buckelwal': 'Humpback Whale', 'Orca': 'Orca Killer Whale', 'Pottwal': 'Sperm Whale', 'Delfin': 'Dolphin',
  'Tümmler': 'Bottlenose Dolphin', 'Robbe': 'Seal', 'Seelöwe': 'Sea Lion', 'Walross': 'Walrus',
  'Seekuh': 'Manatee', 'Rochen': 'Stingray', 'Manta': 'Manta Ray', 'Zitteraal': 'Electric Eel',
  'Krake': 'Octopus', 'Tintenfisch': 'Squid', 'Riesenkrake': 'Giant Squid', 'Qualle': 'Jellyfish',
  'Seestern': 'Starfish', 'Seeigel': 'Sea Urchin', 'Krabbe': 'Crab', 'Hummer': 'Lobster',
  'Garnele': 'Shrimp', 'Krebs': 'Crawfish', 'Muschel': 'Clam', 'Auster': 'Oyster', 'Schnecke': 'Snail',
  'Nacktschnecke': 'Slug', 'Biene': 'Bee', 'Honigbiene': 'Honeybee', 'Wespe': 'Wasp', 'Hornisse': 'Hornet',
  'Hummel': 'Bumblebee', 'Ameise': 'Ant', 'Termite': 'Termite', 'Schmetterling': 'Butterfly',
  'Motte': 'Moth', 'Fliege': 'Fly', 'Mücke': 'Mosquito', 'Libelle': 'Dragonfly', 'Marienkäfer': 'Ladybug',
  'Käfer': 'Beetle', 'Maikäfer': 'Cockchafer', 'Hirschkäfer': 'Stag Beetle', 'Grille': 'Cricket',
  'Heuschrecke': 'Grasshopper', 'Gottesanbeterin': 'Praying Mantis', 'Kakerlake': 'Cockroach',
  'Spinne': 'Spider', 'Vogelspinne': 'Tarantula', 'Schwarze Witwe': 'Black Widow', 'Skorpion': 'Scorpion',
  'Tausendfüßler': 'Centipede', 'Regenwurm': 'Earthworm',

  // Pflanzen
  'Rose': 'Rose', 'Tulpe': 'Tulip', 'Sonnenblume': 'Sunflower', 'Gänseblümchen': 'Daisy', 'Löwenzahn': 'Dandelion',
  'Orchidee': 'Orchid', 'Lilie': 'Lily', 'Nelke': 'Carnation', 'Mohn': 'Poppy', 'Lavendel': 'Lavender',
  'Kaktus': 'Cactus', 'Bonsai': 'Bonsai', 'Palme': 'Palm Tree', 'Eiche': 'Oak Tree', 'Buche': 'Beech Tree',
  'Birke': 'Birch Tree', 'Tanne': 'Fir Tree', 'Fichte': 'Spruce Tree', 'Kiefer': 'Pine Tree', 'Weide': 'Willow Tree',
  'Ahorn': 'Maple Tree', 'Kastanie': 'Chestnut Tree', 'Efeu': 'Ivy', 'Bambus': 'Bamboo', 'Moos': 'Moss',
  'Farn': 'Fern', 'Algen': 'Algae', 'Pilz': 'Mushroom', 'Fliegenpilz': 'Fly Agaric', 'Trüffel': 'Truffle',

  // Berufe
  'Arzt': 'Doctor', 'Ärztin': 'Doctor', 'Krankenpfleger': 'Nurse', 'Krankenschwester': 'Nurse',
  'Zahnarzt': 'Dentist', 'Tierarzt': 'Veterinarian', 'Apotheker': 'Pharmacist', 'Chirurg': 'Surgeon',
  'Psychologe': 'Psychologist', 'Therapeut': 'Therapist', 'Polizist': 'Police Officer',
  'Feuerwehrmann': 'Firefighter', 'Sanitäter': 'Paramedic', 'Soldat': 'Soldier', 'Pilot': 'Pilot',
  'Flugbegleiter': 'Flight Attendant', 'Kapitän': 'Ship Captain', 'Lokführer': 'Train Driver',
  'Busfahrer': 'Bus Driver', 'Taxifahrer': 'Taxi Driver', 'LKW-Fahrer': 'Truck Driver',
  'Lehrer': 'Teacher', 'Professor': 'Professor', 'Erzieher': 'Kindergarten Teacher',
  'Wissenschaftler': 'Scientist', 'Forscher': 'Researcher', 'Astronom': 'Astronomer',
  'Physiker': 'Physicist', 'Chemiker': 'Chemist', 'Biologe': 'Biologist', 'Historiker': 'Historian',
  'Archäologe': 'Archaeologist', 'Anwalt': 'Lawyer', 'Richter': 'Judge', 'Staatsanwalt': 'Prosecutor',
  'Notar': 'Notary', 'Detektiv': 'Detective', 'Spion': 'Spy', 'Journalist': 'Journalist',
  'Reporter': 'Reporter', 'Moderator': 'Host / Presenter', 'Autor': 'Author', 'Schriftsteller': 'Writer',
  'Dichter': 'Poet', 'Übersetzer': 'Translator', 'Schauspieler': 'Actor', 'Regisseur': 'Film Director',
  'Kameramann': 'Cameraman', 'Fotograf': 'Photographer', 'Musiker': 'Musician', 'Sänger': 'Singer',
  'Rapper': 'Rapper', 'DJ': 'DJ', 'Produzent': 'Music Producer', 'Tänzer': 'Dancer',
  'Maler': 'Painter', 'Bildhauer': 'Sculptor', 'Designer': 'Designer', 'Architekt': 'Architect',
  'Ingenieur': 'Engineer', 'Programmierer': 'Software Developer', 'Entwickler': 'Developer',
  'Hacker': 'Hacker', 'Gamer': 'Pro Gamer', 'Streamer': 'Streamer', 'YouTuber': 'YouTuber',
  'Influencer': 'Influencer', 'Model': 'Model', 'Stylist': 'Stylist', 'Friseur': 'Hairdresser',
  'Barbier': 'Barber', 'Kosmetiker': 'Beautician', 'Tätowierer': 'Tattoo Artist', 'Koch': 'Chef',
  'Bäcker': 'Baker', 'Konditor': 'Pastry Chef', 'Fleischer': 'Butcher', 'Metzger': 'Butcher',
  'Kellner': 'Waiter', 'Barkeeper': 'Bartender', 'Barista': 'Barista', 'Sommelier': 'Sommelier',
  'Bauarbeiter': 'Construction Worker', 'Maurer': 'Mason', 'Zimmermann': 'Carpenter',
  'Schreiner': 'Woodworker', 'Tischler': 'Cabinetmaker', 'Elektriker': 'Electrician',
  'Klempner': 'Plumber', 'Installateur': 'Plumber', 'Maler und Lackierer': 'Painter',
  'Dachdecker': 'Roofer', 'Schlosser': 'Locksmith', 'Schmied': 'Blacksmith', 'Mechaniker': 'Mechanic',
  'Mechatroniker': 'Automotive Technician', 'Gärtner': 'Gardener', 'Bauer': 'Farmer',
  'Landwirt': 'Farmer', 'Förster': 'Forester', 'Jäger': 'Hunter', 'Fischer': 'Fisherman',
  'Banker': 'Banker', 'Makler': 'Real Estate Agent', 'Immobilienmakler': 'Real Estate Agent',
  'Börsenmakler': 'Stockbroker', 'Buchhalter': 'Accountant', 'Berater': 'Consultant',
  'Manager': 'Manager', 'CEO': 'CEO', 'Unternehmer': 'Entrepreneur', 'Sekretär': 'Secretary',
  'Assistent': 'Assistant', 'Empfangsmitarbeiter': 'Receptionist', 'Kassierer': 'Cashier',
  'Verkäufer': 'Store Clerk', 'Lagerarbeiter': 'Warehouse Worker', 'Postbote': 'Mail Carrier',
  'Briefträger': 'Mailman', 'Paketbote': 'Delivery Driver', 'Müllmann': 'Garbage Collector',
  'Reinigungskraft': 'Cleaner', 'Hausmeister': 'Janitor', 'Sicherheitsdienst': 'Security Guard',
  'Türsteher': 'Bouncer', 'Bodyguard': 'Bodyguard', 'Astronaut': 'Astronaut',
  'Taucher': 'Diver', 'Bergsteiger': 'Mountaineer', 'Stuntman': 'Stunt Performer',
  'Zauberer': 'Magician', 'Clown': 'Clown', 'Akrobat': 'Acrobat', 'Dompteur': 'Animal Tamer',
  'Politiker': 'Politician', 'Bürgermeister': 'Mayor', 'Minister': 'Minister', 'Präsident': 'President',
  'König': 'King', 'Königin': 'Queen', 'Prinz': 'Prince', 'Prinzessin': 'Princess',
  'Papst': 'Pope', 'Priester': 'Priest', 'Pfarrer': 'Pastor', 'Mönch': 'Monk', 'Nonne': 'Nun',

  // Kleidung & Mode
  'T-Shirt': 'T-Shirt', 'Hemd': 'Shirt', 'Bluse': 'Blouse', 'Poloshirt': 'Polo Shirt', 'Top': 'Tank Top',
  'Pullover': 'Sweater', 'Hoodie': 'Hoodie', 'Sweatshirt': 'Sweatshirt', 'Strickjacke': 'Cardigan',
  'Weste': 'Vest', 'Jacke': 'Jacket', 'Mantel': 'Coat', 'Winterjacke': 'Winter Jacket',
  'Lederjacke': 'Leather Jacket', 'Jeansjacke': 'Denim Jacket', 'Regenjacke': 'Rain Jacket',
  'Windbreaker': 'Windbreaker', 'Blazer': 'Blazer', 'Anzug': 'Suit', 'Smoking': 'Tuxedo',
  'Hose': 'Pants', 'Jeans': 'Jeans', 'Jogginghose': 'Sweatpants', 'Shorts': 'Shorts',
  'Badehose': 'Swim Trunks', 'Bikini': 'Bikini', 'Badeanzug': 'Swimsuit', 'Rock': 'Skirt',
  'Minirock': 'Miniskirt', 'Kleid': 'Dress', 'Abendkleid': 'Evening Gown', 'Brautkleid': 'Wedding Dress',
  'Sommerkleid': 'Summer Dress', 'Socken': 'Socks', 'Kniestrümpfe': 'Knee-High Socks',
  'Strumpfhose': 'Tights', 'Unterwäsche': 'Underwear', 'Boxershorts': 'Boxer Shorts',
  'Slip': 'Briefs', 'BH': 'Bra', 'Schuhe': 'Shoes', 'Sneaker': 'Sneakers', 'Turnschuhe': 'Running Shoes',
  'Stiefel': 'Boots', 'High Heels': 'High Heels', 'Pumps': 'Pumps', 'Sandalen': 'Sandals',
  'Flip-Flops': 'Flip Flops', 'Hausschuhe': 'Slippers', 'Mütze': 'Beanie', 'Cap': 'Baseball Cap',
  'Hut': 'Hat', 'Zylinder': 'Top Hat', 'Schal': 'Scarf', 'Handschuhe': 'Gloves',
  'Gürtel': 'Belt', 'Krawatte': 'Tie', 'Fliege': 'Bowtie', 'Schmuck': 'Jewelry',
  'Halskette': 'Necklace', 'Armband': 'Bracelet', 'Ring': 'Ring', 'Ohrringe': 'Earrings',

  // Technik & Fahrzeuge
  'Smartphone': 'Smartphone', 'Handy': 'Cell Phone', 'Tablet': 'Tablet', 'Laptop': 'Laptop',
  'Computer': 'Desktop PC', 'Bildschirm': 'Monitor', 'Tastatur': 'Keyboard', 'Maus': 'Computer Mouse',
  'Drucker': 'Printer', 'Scanner': 'Scanner', 'Router': 'Wi-Fi Router', 'Modem': 'Modem',
  'Server': 'Server', 'Festplatte': 'Hard Drive', 'SSD': 'SSD Drive', 'USB-Stick': 'USB Flash Drive',
  'Fernseher': 'Television', 'Beamer': 'Projector', 'Lautsprecher': 'Speaker', 'Soundbar': 'Soundbar',
  'Kamera': 'Camera', 'Spiegelreflexkamera': 'DSLR Camera', 'Drohne': 'Drone', 'Mikrofon': 'Microphone',
  'Auto': 'Car', 'Sportwagen': 'Sports Car', 'Cabrio': 'Convertible', 'SUV': 'SUV',
  'Elektroauto': 'Electric Car', 'LKW': 'Truck', 'Bus': 'Bus', 'Motorrad': 'Motorcycle',
  'Roller': 'Scooter', 'E-Scooter': 'Electric Scooter', 'Fahrrad': 'Bicycle', 'Mountainbike': 'Mountain Bike',
  'E-Bike': 'E-Bike', 'Skateboard': 'Skateboard', 'Zug': 'Train', 'ICE': 'High-Speed Train',
  'U-Bahn': 'Subway / Metro', 'Straßenbahn': 'Tram', 'Flugzeug': 'Airplane', 'Helikopter': 'Helicopter',
  'Schiff': 'Ship', 'Boot': 'Boat', 'Yacht': 'Yacht', 'U-Boot': 'Submarine', 'Rakete': 'Rocket',
  'Raumschiff': 'Spaceship', 'Satellit': 'Satellite',

  // Farben
  'Rot': 'Red', 'Blau': 'Blue', 'Grün': 'Green', 'Gelb': 'Yellow', 'Schwarz': 'Black', 'Weiß': 'White',
  'Grau': 'Gray', 'Braun': 'Brown', 'Orange': 'Orange', 'Lila': 'Purple', 'Violett': 'Violet',
  'Rosa': 'Pink', 'Türkis': 'Turquoise', 'Gold': 'Gold', 'Silber': 'Silver', 'Bronze': 'Bronze',
  'Beige': 'Beige', 'Cyan': 'Cyan', 'Magenta': 'Magenta', 'Indigo': 'Indigo',
}

function translateWord(germanText) {
  if (dict[germanText]) return dict[germanText]
  // If already recognizable or english-friendly, return as is
  return germanText
}

const deCatalogContent = fs.readFileSync('src/lib/game/content/catalog.ts', 'utf-8')
const catBlocks = deCatalogContent.split(/\{\s*id:\s*'/).slice(1)

const enCategories = []

for (const block of catBlocks) {
  const idMatch = block.match(/^([^']+)'/)
  const nameMatch = block.match(/displayName:\s*'([^']+)'/)
  const iconMatch = block.match(/icon:\s*'([^']+)'/)
  const wordMatches = [...block.matchAll(/\{\s*text:\s*'([^']+)',\s*hint:\s*'([^']*)'\s*\}/g)]
  if (idMatch && nameMatch && iconMatch) {
    const id = idMatch[1]
    const icon = iconMatch[1]
    const englishDisplayName = catNameMap[id] || nameMatch[1]
    const englishWords = wordMatches.map(m => {
      const deWord = m[1]
      const hint = m[2]
      const enWord = translateWord(deWord)
      return { text: enWord, hint: hint ? (dict[hint] || hint) : '' }
    })

    enCategories.push({
      id,
      displayName: englishDisplayName,
      icon,
      words: englishWords,
    })
  }
}

console.log(`Generating English catalog with ${enCategories.length} categories...`)

let out = `/**
 * English Content Catalog (v2.4.0)
 * ---------------------------------
 * English counterpart to catalog.ts for bilingual game support.
 * 64 categories with translated English titles and words.
 */

import type { Category } from '../models'

export const CATALOG_EN: Category[] = [
`

for (const cat of enCategories) {
  out += `  {\n    id: '${cat.id}',\n    displayName: '${cat.displayName}',\n    icon: '${cat.icon}',\n    words: [\n`
  for (const w of cat.words) {
    const escapedText = w.text.replace(/'/g, "\\'")
    const escapedHint = w.hint.replace(/'/g, "\\'")
    out += `      { text: '${escapedText}', hint: '${escapedHint}' },\n`
  }
  out += `    ],\n  },\n`
}

out += `]\n`

fs.writeFileSync('src/lib/game/content/catalogEn.ts', out, 'utf-8')
console.log('Successfully wrote src/lib/game/content/catalogEn.ts!')

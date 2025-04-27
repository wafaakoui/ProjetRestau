export const users = [
    { id: '1', email: 'pizza.chef@example.com', password: 'pizza123', role: 'Staff', name: 'Chef Pizza' },
    { id: '2', email: 'cafe.chef@example.com', password: 'cafe123', role: 'Staff', name: 'Chef Café' },
    { id: '3', email: 'taco.chef@example.com', password: 'taco123', role: 'Staff', name: 'Chef Tacos' },
    { id: '4', email: 'manager@example.com', password: 'manager', role: 'Manager', name: 'Manager' },
  ];
  
  export const ticketsData = [
    { id: '1', orderNumber: '123', orderDetails: 'Pizza Margherita', status: 'En préparation', chefId: '1', isDeleted: false },
    { id: '2', orderNumber: '124', orderDetails: 'Pizza Pepperoni', status: 'En préparation', chefId: '1' },
    { id: '3', orderNumber: '125', orderDetails: 'Pizza Végétarienne', status: 'Terminé', chefId: '1' },
    { id: '4', orderNumber: '126', orderDetails: 'Café Espresso', status: 'En préparation', chefId: '2' },
    { id: '5', orderNumber: '127', orderDetails: 'Tacos Mexicain', status: 'En préparation', chefId: '3' },
    { id: '6', orderNumber: '130', orderDetails: 'Café creme', status: 'En préparation', chefId: '2' },
    { id: '8', orderNumber: '131', orderDetails: 'Café', status: 'En préparation', chefId: '2' },
    { id: '9', orderNumber: '132', orderDetails: 'Pizza 4fromages', status: 'En préparation', chefId: '1' },
    { id: '10', orderNumber: '133', orderDetails: 'Pizza', status: 'En préparation', chefId: '1' },
    { id: '11', orderNumber: '143', orderDetails: 'Pizza calzone', status: 'En préparation', chefId: '1' },
    { id: '12', orderNumber: '136', orderDetails: 'Pizza bianca', status: 'En préparation', chefId: '1' },
    { id: '13', orderNumber: '150', orderDetails: 'Test Manager', status: 'En préparation', chefId: '4' },
  ];
  
  export const restaurants = [
    { username: 'admin', password: 'passpa', name: 'Le Gourmet', storeId: '6787a808bf529e8ce963a350' },
    { username: 'chef1', password: 'pizza456', name: 'Pizza Express', storeId: '6787a808bf529e8ce963a351' },
    { username: 'manager', password: 'burger789', name: 'Burger House', storeId: '6787a808bf529e8ce963a352' },
  ];
  
  export const categories = [
    {
      id: '6787bfa0998e966a9884f63d',
      name: 'Entrées',
      isActive: true,
      storeId: '6787a808bf529e8ce963a350',
      products: [
        { id: 'entree1', name: 'BRUSCHETTA', description: 'Tomate, basilic, huile d\'olive', price: 6.99, isActive: true, categoryId: '6787bfa0998e966a9884f63d' },
        { id: 'entree2', name: 'SOUPE À L\'OIGNON', description: 'Oignons, fromage gratiné', price: 5.99, isActive: true, categoryId: '6787bfa0998e966a9884f63d' },
        { id: 'entree3', name: 'CARPACCIO DE BŒUF', description: 'Bœuf, parmesan, roquette', price: 8.99, isActive: true, categoryId: '6787bfa0998e966a9884f63d' },
      ],
    },
    {
      id: '6787c0d0998e966a988500c2',
      name: 'Plats principaux',
      isActive: true,
      storeId: '6787a808bf529e8ce963a350',
      products: [
        { id: 'plat1', name: 'STEAK FRITES', description: 'Steak de bœuf, frites maison', price: 14.99, isActive: true, categoryId: '6787c0d0998e966a988500c2' },
        { id: 'plat2', name: 'POULET RÔTI', description: 'Poulet, légumes rôtis', price: 12.99, isActive: true, categoryId: '6787c0d0998e966a988500c2' },
        { id: 'plat3', name: 'SAUMON GRILLÉ', description: 'Saumon, sauce citronnée', price: 16.99, isActive: true, categoryId: '6787c0d0998e966a988500c2' },
      ],
    },
    {
      id: '6787c43dd42480224595f5b7',
      name: 'Desserts',
      isActive: true,
      storeId: '6787a808bf529e8ce963a350',
      products: [
        { id: 'dessert1', name: 'TIRAMISU', description: 'Mascarpone, café, cacao', price: 5.99, isActive: true, categoryId: '6787c43dd42480224595f5b7' },
        { id: 'dessert2', name: 'CRÈME BRÛLÉE', description: 'Crème vanillée, caramel', price: 4.99, isActive: true, categoryId: '6787c43dd42480224595f5b7' },
        { id: 'dessert3', name: 'TARTE AUX POMMES', description: 'Pommes, pâte sablée', price: 4.50, isActive: true, categoryId: '6787c43dd42480224595f5b7' },
      ],
    },
    {
      id: '6787c4d5d42480224595f8cc',
      name: 'Boissons',
      isActive: true,
      storeId: '6787a808bf529e8ce963a350',
      products: [
        { id: 'boisson1', name: 'EAU PÉTILLANTE', description: 'Eau gazeuse, 50cl', price: 2.50, isActive: true, categoryId: '6787c4d5d42480224595f8cc' },
        { id: 'boisson2', name: 'COCA-COLA', description: 'Soda, 33cl', price: 2.99, isActive: true, categoryId: '6787c4d5d42480224595f8cc' },
        { id: 'boisson3', name: 'JUS D\'ORANGE', description: 'Jus frais, 25cl', price: 3.50, isActive: true, categoryId: '6787c4d5d42480224595f8cc' },
      ],
    },
    {
      id: '6788e7790509c30095da1056',
      name: 'Pizzas',
      isActive: true,
      storeId: '6787a808bf529e8ce963a350',
      products: [
        { id: 'prod1', name: 'PIZZA NAPOLITAINE', description: 'Sauce barbecue, cheddar', price: 12.99, isActive: true, categoryId: '6788e7790509c30095da1056' },
        { id: 'prod2', name: 'PIZZA TONNA', description: 'Sauce tomate, mozzarella', price: 11.99, isActive: false, categoryId: '6788e7790509c30095da1056' },
        { id: 'prod3', name: 'PIZZA BURRATA', description: 'Sauce tomate, mozzarella, burrata', price: 14.99, isActive: true, categoryId: '6788e7790509c30095da1056' },
        { id: 'prod4', name: 'PIZZA CHEVRE MIEL', description: 'Crème fraîche, mozzarella, chèvre, miel', price: 13.99, isActive: true, categoryId: '6788e7790509c30095da1056' },
        { id: 'prod5', name: 'PIZZA REGINA', description: 'Crème fraîche, mozzarella', price: 10.99, isActive: true, categoryId: '6788e7790509c30095da1056' },
        { id: 'prod6', name: 'PIZZA 5 CHEESE', description: 'Crème fraîche, mozzarella', price: 15.99, isActive: true, categoryId: '6788e7790509c30095da1056' },
      ],
    },
    {
      id: '6788ed760509c30095da443b',
      name: 'Cafés',
      isActive: true,
      storeId: '6787a808bf529e8ce963a350',
      products: [
        { id: 'cafe1', name: 'ESPRESSO', description: 'Café noir, 5cl', price: 2.00, isActive: true, categoryId: '6788ed760509c30095da443b' },
        { id: 'cafe2', name: 'CAPPUCCINO', description: 'Café, lait, mousse', price: 3.50, isActive: true, categoryId: '6788ed760509c30095da443b' },
        { id: 'cafe3', name: 'CAFÉ AU LAIT', description: 'Café, lait chaud', price: 3.00, isActive: true, categoryId: '6788ed760509c30095da443b' },
      ],
    },
    {
      id: '6788f2120509c30095da61a4',
      name: 'Tacos',
      isActive: true,
      storeId: '6787a808bf529e8ce963a350',
      products: [
        { id: 'taco1', name: 'TACO CLASSIQUE', description: 'Viande hachée, salade, tomate', price: 8.99, isActive: true, categoryId: '6788f2120509c30095da61a4' },
        { id: 'taco2', name: 'TACO POULET', description: 'Poulet, fromage, sauce piquante', price: 9.99, isActive: false, categoryId: '6788f2120509c30095da61a4' },
        { id: 'taco3', name: 'TACO VÉGÉTARIEN', description: 'Légumes, guacamole', price: 7.99, isActive: true, categoryId: '6788f2120509c30095da61a4' },
      ],
    },
    {
      id: '6788f6190509c30095da709e',
      name: 'Salades',
      isActive: true,
      storeId: '6787a808bf529e8ce963a350',
      products: [
        { id: 'salade1', name: 'SALADE CÉSAR', description: 'Poulet, parmesan, croûtons', price: 9.99, isActive: true, categoryId: '6788f6190509c30095da709e' },
        { id: 'salade2', name: 'SALADE NIÇOISE', description: 'Thon, œuf, olives', price: 10.99, isActive: true, categoryId: '6788f6190509c30095da709e' },
        { id: 'salade3', name: 'SALADE VERTE', description: 'Laitue, concombre, vinaigrette', price: 6.99, isActive: true, categoryId: '6788f6190509c30095da709e' },
      ],
    },
    {
      id: '6788fa380509c30095da7c6d',
      name: 'Sandwichs',
      isActive: true,
      storeId: '6787a808bf529e8ce963a350',
      products: [
        { id: 'sandwich1', name: 'JAMBON BEURRE', description: 'Jambon, beurre, baguette', price: 5.99, isActive: true, categoryId: '6788fa380509c30095da7c6d' },
        { id: 'sandwich2', name: 'POULET MAYO', description: 'Poulet, mayonnaise, salade', price: 6.99, isActive: true, categoryId: '6788fa380509c30095da7c6d' },
        { id: 'sandwich3', name: 'THON CRUDITÉS', description: 'Thon, légumes frais', price: 6.50, isActive: true, categoryId: '6788fa380509c30095da7c6d' },
      ],
    },
    {
      id: '6788fc970509c30095dbc578',
      name: 'Burgers',
      isActive: true,
      storeId: '6787a808bf529e8ce963a350',
      products: [
        { id: 'burger1', name: 'BURGER MAISON', description: 'Steak, cheddar, salade', price: 10.99, isActive: true, categoryId: '6788fc970509c30095dbc578' },
        { id: 'burger2', name: 'SMASH BURGER', description: 'Double steak, fromage, oignons', price: 12.99, isActive: true, categoryId: '6788fc970509c30095dbc578' },
        { id: 'burger3', name: 'BURGER CLASSIQUE', description: 'Steak, tomate, laitue', price: 9.99, isActive: true, categoryId: '6788fc970509c30095dbc578' },
      ],
    },
    {
      id: '6788fdb80509c30095dc8d65',
      name: 'Pâtes',
      isActive: true,
      storeId: '6787a808bf529e8ce963a350',
      products: [
        { id: 'pate1', name: 'SPAGHETTI CARBONARA', description: 'Crème, pancetta, parmesan', price: 11.99, isActive: true, categoryId: '6788fdb80509c30095dc8d65' },
        { id: 'pate2', name: 'PENNE ARRABIATA', description: 'Sauce tomate, piment', price: 9.99, isActive: true, categoryId: '6788fdb80509c30095dc8d65' },
        { id: 'pate3', name: 'LASAGNE', description: 'Bœuf, béchamel, fromage', price: 12.99, isActive: true, categoryId: '6788fdb80509c30095dc8d65' },
      ],
    },
    {
      id: '6788fea40509c30095dce620',
      name: 'Sushis',
      isActive: true,
      storeId: '6787a808bf529e8ce963a350',
      products: [
        { id: 'sushi1', name: 'MAKI SAUMON', description: 'Saumon, riz, algue', price: 6.99, isActive: true, categoryId: '6788fea40509c30095dce620' },
        { id: 'sushi2', name: 'NIGIRI THON', description: 'Thon, riz', price: 7.99, isActive: true, categoryId: '6788fea40509c30095dce620' },
        { id: 'sushi3', name: 'CALIFORNIA ROLL', description: 'Avocat, crabe, concombre', price: 8.99, isActive: true, categoryId: '6788fea40509c30095dce620' },
      ],
    },
    {
      id: '6788ffc70509c30095dd44ae',
      name: 'Soupes',
      isActive: true,
      storeId: '6787a808bf529e8ce963a350',
      products: [
        { id: 'soupe1', name: 'SOUPE MISO', description: 'Miso, tofu, algues', price: 4.99, isActive: true, categoryId: '6788ffc70509c30095dd44ae' },
        { id: 'soupe2', name: 'SOUPE DE LÉGUMES', description: 'Carottes, poireaux, pommes de terre', price: 4.50, isActive: true, categoryId: '6788ffc70509c30095dd44ae' },
        { id: 'soupe3', name: 'SOUPE DE POISSON', description: 'Poisson, tomates, herbes', price: 5.99, isActive: true, categoryId: '6788ffc70509c30095dd44ae' },
      ],
    },
    {
      id: '6788ffd60509c30095dd4c96',
      name: 'Grillades',
      isActive: true,
      storeId: '6787a808bf529e8ce963a350',
      products: [
        { id: 'grillade1', name: 'ENTRECÔTE', description: 'Bœuf, sauce au poivre', price: 18.99, isActive: true, categoryId: '6788ffd60509c30095dd4c96' },
        { id: 'grillade2', name: 'BROCHETTE DE POULET', description: 'Poulet, poivrons, oignons', price: 14.99, isActive: true, categoryId: '6788ffd60509c30095dd4c96' },
        { id: 'grillade3', name: 'CÔTE D\'AGNEAU', description: 'Agneau, herbes de Provence', price: 16.99, isActive: true, categoryId: '6788ffd60509c30095dd4c96' },
      ],
    },
    {
      id: '6789021b0509c30095de7622',
      name: 'Végétarien',
      isActive: true,
      storeId: '6787a808bf529e8ce963a350',
      products: [
        { id: 'vege1', name: 'CURRY DE LÉGUMES', description: 'Légumes, lait de coco', price: 10.99, isActive: true, categoryId: '6789021b0509c30095de7622' },
        { id: 'vege2', name: 'FALAFEL', description: 'Pois chiches, salade, tahini', price: 8.99, isActive: true, categoryId: '6789021b0509c30095de7622' },
        { id: 'vege3', name: 'RATATOUILLE', description: 'Légumes méditerranéens', price: 9.99, isActive: true, categoryId: '6789021b0509c30095de7622' },
      ],
    },
    {
      id: '678902330509c30095de8ad0',
      name: 'Végan',
      isActive: true,
      storeId: '6787a808bf529e8ce963a350',
      products: [
        { id: 'vegan1', name: 'BUDDHA BOWL', description: 'Quinoa, avocat, légumes', price: 11.99, isActive: true, categoryId: '678902330509c30095de8ad0' },
        { id: 'vegan2', name: 'BURGER VÉGAN', description: 'Galette de légumes, salade', price: 10.99, isActive: true, categoryId: '678902330509c30095de8ad0' },
        { id: 'vegan3', name: 'SOUPE VÉGANE', description: 'Légumes, herbes', price: 5.99, isActive: true, categoryId: '678902330509c30095de8ad0' },
      ],
    },
    {
      id: '678903890509c30095df3e2f',
      name: 'Petit-déjeuner',
      isActive: true,
      storeId: '6787a808bf529e8ce963a350',
      products: [
        { id: 'petitdej1', name: 'CROISSANT', description: 'Beurre, confiture', price: 2.50, isActive: true, categoryId: '678903890509c30095df3e2f' },
        { id: 'petitdej2', name: 'ŒUFS BROUILLÉS', description: 'Œufs, pain grillé', price: 4.99, isActive: true, categoryId: '678903890509c30095df3e2f' },
        { id: 'petitdej3', name: 'PANCAKES', description: 'Sirop d\'érable, fruits', price: 6.99, isActive: true, categoryId: '678903890509c30095df3e2f' },
      ],
    },
    {
      id: '678903ac0509c30095df3fc2',
      name: 'Brunch',
      isActive: true,
      storeId: '6787a808bf529e8ce963a350',
      products: [
        { id: 'brunch1', name: 'AVOCAT TOAST', description: 'Avocat, œuf poché', price: 8.99, isActive: true, categoryId: '678903ac0509c30095df3fc2' },
        { id: 'brunch2', name: 'ASSIETTE BRUNCH', description: 'Œufs, bacon, fruits', price: 12.99, isActive: true, categoryId: '678903ac0509c30095df3fc2' },
        { id: 'brunch3', name: 'SMOOTHIE BOWL', description: 'Yaourt, granola, fruits', price: 9.99, isActive: true, categoryId: '678903ac0509c30095df3fc2' },
      ],
    },
    {
      id: '67892c050509c3009504ec07',
      name: 'Apéritifs',
      isActive: true,
      storeId: '6787a808bf529e8ce963a350',
      products: [
        { id: 'aperitif1', name: 'OLIVES', description: 'Olives marinées', price: 3.99, isActive: true, categoryId: '67892c050509c3009504ec07' },
        { id: 'aperitif2', name: 'HOUMOUS', description: 'Pois chiches, pain pita', price: 4.99, isActive: true, categoryId: '67892c050509c3009504ec07' },
        { id: 'aperitif3', name: 'TAPENADE', description: 'Olives noires, anchois', price: 4.50, isActive: true, categoryId: '67892c050509c3009504ec07' },
      ],
    },
    {
      id: '678a1f690509c300950f46d1',
      name: 'Cocktails',
      isActive: true,
      storeId: '6787a808bf529e8ce963a350',
      products: [
        { id: 'cocktail1', name: 'MOJITO', description: 'Rhum, menthe, citron', price: 7.99, isActive: true, categoryId: '678a1f690509c300950f46d1' },
        { id: 'cocktail2', name: 'MARGARITA', description: 'Tequila, citron vert', price: 8.99, isActive: true, categoryId: '678a1f690509c300950f46d1' },
        { id: 'cocktail3', name: 'PINA COLADA', description: 'Rhum, ananas, coco', price: 8.50, isActive: true, categoryId: '678a1f690509c300950f46d1' },
      ],
    },
    {
      id: '678a2edf0509c30095214e32',
      name: 'Vins',
      isActive: true,
      storeId: '6787a808bf529e8ce963a350',
      products: [
        { id: 'vin1', name: 'BORDEAUX ROUGE', description: 'Vin rouge, 75cl', price: 15.99, isActive: true, categoryId: '678a2edf0509c30095214e32' },
        { id: 'vin2', name: 'CHARDONNAY BLANC', description: 'Vin blanc, 75cl', price: 14.99, isActive: true, categoryId: '678a2edf0509c30095214e32' },
        { id: 'vin3', name: 'ROSÉ PROVENCE', description: 'Vin rosé, 75cl', price: 13.99, isActive: true, categoryId: '678a2edf0509c30095214e32' },
      ],
    },
    {
      id: '678a60c80509c3009533b868',
      name: 'Bières',
      isActive: true,
      storeId: '6787a808bf529e8ce963a350',
      products: [
        { id: 'biere1', name: 'HEINEKEN', description: 'Bière blonde, 33cl', price: 3.99, isActive: true, categoryId: '678a60c80509c3009533b868' },
        { id: 'biere2', name: 'IPA', description: 'Bière artisanale, 33cl', price: 4.99, isActive: true, categoryId: '678a60c80509c3009533b868' },
        { id: 'biere3', name: 'BLANCHE', description: 'Bière blanche, 33cl', price: 4.50, isActive: true, categoryId: '678a60c80509c3009533b868' },
      ],
    },
    {
      id: '678a61660509c3009533cf0d',
      name: 'Jus',
      isActive: true,
      storeId: '6787a808bf529e8ce963a350',
      products: [
        { id: 'jus1', name: 'JUS DE POMME', description: 'Jus frais, 25cl', price: 3.00, isActive: true, categoryId: '678a61660509c3009533cf0d' },
        { id: 'jus2', name: 'JUS D\'ANANAS', description: 'Jus frais, 25cl', price: 3.50, isActive: true, categoryId: '678a61660509c3009533cf0d' },
        { id: 'jus3', name: 'JUS DE MANGUE', description: 'Jus frais, 25cl', price: 3.99, isActive: true, categoryId: '678a61660509c3009533cf0d' },
      ],
    },
    {
      id: '678a62150509c3009533dfff',
      name: 'Smoothies',
      isActive: true,
      storeId: '6787a808bf529e8ce963a350',
      products: [
        { id: 'smoothie1', name: 'SMOOTHIE FRAISE', description: 'Fraise, banane, yaourt', price: 4.99, isActive: true, categoryId: '678a62150509c3009533dfff' },
        { id: 'smoothie2', name: 'SMOOTHIE MANGUE', description: 'Mangue, ananas, coco', price: 5.50, isActive: true, categoryId: '678a62150509c3009533dfff' },
        { id: 'smoothie3', name: 'SMOOTHIE VERT', description: 'Épinards, kiwi, pomme', price: 5.00, isActive: true, categoryId: '678a62150509c3009533dfff' },
      ],
    },
    {
      id: '678a74eeea82efad74957f61',
      name: 'Thés',
      isActive: true,
      storeId: '6787a808bf529e8ce963a350',
      products: [
        { id: 'the1', name: 'THÉ VERT', description: 'Thé vert nature', price: 2.99, isActive: true, categoryId: '678a74eeea82efad74957f61' },
        { id: 'the2', name: 'THÉ À LA MENTHE', description: 'Thé vert, menthe fraîche', price: 3.50, isActive: true, categoryId: '678a74eeea82efad74957f61' },
        { id: 'the3', name: 'THÉ NOIR', description: 'Thé noir, bergamote', price: 3.00, isActive: true, categoryId: '678a74eeea82efad74957f61' },
      ],
    },
    {
      id: '678a7ba2ea82efad74a01a8e',
      name: 'Infusions',
      isActive: true,
      storeId: '6787a808bf529e8ce963a350',
      products: [
        { id: 'infusion1', name: 'INFUSION CAMOMILLE', description: 'Camomille, miel', price: 2.99, isActive: true, categoryId: '678a7ba2ea82efad74a01a8e' },
        { id: 'infusion2', name: 'INFUSION VERVEINE', description: 'Verveine, citron', price: 3.00, isActive: true, categoryId: '678a7ba2ea82efad74a01a8e' },
        { id: 'infusion3', name: 'INFUSION FRUITS ROUGES', description: 'Fruits rouges, hibiscus', price: 3.50, isActive: true, categoryId: '678a7ba2ea82efad74a01a8e' },
      ],
    },
    {
      id: '678e109e5a7265251089a269',
      name: 'Plats du jour',
      isActive: true,
      storeId: '6787a808bf529e8ce963a350',
      products: [
        { id: 'platdujour1', name: 'POULET BASQUAISE', description: 'Poulet, poivrons, tomates', price: 13.99, isActive: true, categoryId: '678e109e5a7265251089a269' },
        { id: 'platdujour2', name: 'BOEUF BOURGUIGNON', description: 'Bœuf, vin rouge, carottes', price: 15.99, isActive: true, categoryId: '678e109e5a7265251089a269' },
        { id: 'platdujour3', name: 'QUICHE LORRAINE', description: 'Œufs, lardons, fromage', price: 11.99, isActive: true, categoryId: '678e109e5a7265251089a269' },
      ],
    },
    {
      id: '67dd3942ffca31365f40e730',
      name: 'Menu enfant',
      isActive: true,
      storeId: '6787a808bf529e8ce963a350',
      products: [
        { id: 'enfant1', name: 'NUGGETS FRITES', description: 'Nuggets, frites, jus', price: 6.99, isActive: true, categoryId: '67dd3942ffca31365f40e730' },
        { id: 'enfant2', name: 'MINI BURGER', description: 'Burger, frites, compote', price: 7.50, isActive: true, categoryId: '67dd3942ffca31365f40e730' },
        { id: 'enfant3', name: 'SPAGHETTI BOLO', description: 'Spaghetti, sauce tomate', price: 6.50, isActive: true, categoryId: '67dd3942ffca31365f40e730' },
      ],
    },
  ];
  
  
  
import { PrismaClient, UserRole, AdsPlanType, AdsPlanBillingCycle, AdFieldType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@primewear.lk" },
    update: {},
    create: {
      email: "admin@primewear.lk",
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
      firstName: "System",
      lastName: "Admin",
      emailVerified: true,
      isActive: true,
    },
  });

  console.log("✅ Admin user created:", admin.email);

  // Create some sample categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: "mens-clothing" },
      update: {},
      create: {
        name: "Men's Clothing",
        slug: "mens-clothing",
        description: "Clothing for men",
        isActive: true,
        sortOrder: 1,
      },
    }),
    prisma.category.upsert({
      where: { slug: "womens-clothing" },
      update: {},
      create: {
        name: "Women's Clothing",
        slug: "womens-clothing",
        description: "Clothing for women",
        isActive: true,
        sortOrder: 2,
      },
    }),
    prisma.category.upsert({
      where: { slug: "accessories" },
      update: {},
      create: {
        name: "Accessories",
        slug: "accessories",
        description: "Fashion accessories",
        isActive: true,
        sortOrder: 3,
      },
    }),
    prisma.category.upsert({
      where: { slug: "footwear" },
      update: {},
      create: {
        name: "Footwear",
        slug: "footwear",
        description: "Shoes and sandals",
        isActive: true,
        sortOrder: 4,
      },
    }),
  ]);

  console.log("✅ Categories created:", categories.length);

  // Create default system settings
  const settings = await Promise.all([
    prisma.systemSetting.upsert({
      where: { key: "platform_commission" },
      update: {},
      create: {
        key: "platform_commission",
        value: { rate: 10, description: "Default platform commission percentage" },
      },
    }),
    prisma.systemSetting.upsert({
      where: { key: "order_cancel_hours" },
      update: {},
      create: {
        key: "order_cancel_hours",
        value: { hours: 24, description: "Hours within which order can be cancelled" },
      },
    }),
    prisma.systemSetting.upsert({
      where: { key: "return_request_hours" },
      update: {},
      create: {
        key: "return_request_hours",
        value: { hours: 24, description: "Hours after delivery within which return can be requested" },
      },
    }),
    prisma.systemSetting.upsert({
      where: { key: "payout_schedule" },
      update: {},
      create: {
        key: "payout_schedule",
        value: { frequency: "weekly", day: "monday", description: "Vendor payout schedule" },
      },
    }),
  ]);

  console.log("✅ System settings created:", settings.length);

  // ==================== SEED CLASSIFIED ADS MODULE ====================
  console.log("🌱 Seeding Classified Ads plans...");

  const adsPlans = [
    { type: AdsPlanType.FREE,    name: "Free Plan",    maxAds: 3,   price: 0,    billingCycle: AdsPlanBillingCycle.LIFETIME, features: ["3 active ads", "Standard listing", "Standard support"] },
    { type: AdsPlanType.BASIC,   name: "Basic Plan",   maxAds: 20,  price: 1000, billingCycle: AdsPlanBillingCycle.MONTHLY,  features: ["20 active ads", "Standard listing", "Priority email support"] },
    { type: AdsPlanType.PRO,     name: "Pro Plan",     maxAds: 50,  price: 3000, billingCycle: AdsPlanBillingCycle.MONTHLY,  features: ["50 active ads", "Standard + 2 Top Ads", "Priority support", "Seller storefront"] },
    { type: AdsPlanType.PREMIUM, name: "Premium Plan", maxAds: 100, price: 5000, billingCycle: AdsPlanBillingCycle.MONTHLY,  features: ["100 active ads", "Standard + 10 Top Ads", "Featured badge", "Premium support", "Seller storefront page"] }
  ];

  for (const plan of adsPlans) {
    await prisma.adsPlan.upsert({
      where: { type: plan.type },
      update: {
        name: plan.name,
        maxAds: plan.maxAds,
        price: plan.price,
        billingCycle: plan.billingCycle,
        features: plan.features
      },
      create: {
        type: plan.type,
        name: plan.name,
        maxAds: plan.maxAds,
        price: plan.price,
        billingCycle: plan.billingCycle,
        features: plan.features
      }
    });
  }

  console.log("✅ Ads plans seeded successfully.");

  console.log("🌱 Seeding Classified Ads categories and fields...");

  const categoriesData = [
    {
      name: "Mobiles",
      slug: "mobiles",
      icon: "/images/categories/mobiles.png",
      sortOrder: 1,
      subCategories: [
        {
          name: "Mobile Phones",
          slug: "mobile-phones",
          sortOrder: 1,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Used", "Brand New", "Refurbished"] },
            { fieldKey: "brand", label: "Brand", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 2, options: ["Samsung", "Apple", "Huawei", "Xiaomi", "Nokia", "Oppo", "Vivo", "Realme", "OnePlus", "Other"] },
            { fieldKey: "model", label: "Model", fieldType: AdFieldType.TEXT, isRequired: true, isOptional: false, sortOrder: 3, placeholder: "e.g. Galaxy A30S" },
            { fieldKey: "edition", label: "Edition", fieldType: AdFieldType.TEXT, isRequired: false, isOptional: true, sortOrder: 4, placeholder: "Enter the edition of your phone" },
            { fieldKey: "features", label: "Features", fieldType: AdFieldType.CHECKBOX, isRequired: false, isOptional: true, sortOrder: 5, options: ["USB Type-B Port", "USB Type-C Port", "Fast Charging", "Flash Charging", "Expandable Memory", "Bluetooth", "Wifi", "GPS", "Fingerprint Sensor", "Infrared port"] },
            { fieldKey: "os", label: "Operating System", fieldType: AdFieldType.RADIO, isRequired: false, isOptional: true, sortOrder: 6, options: ["Android", "iOS", "Windows"] },
            { fieldKey: "ram", label: "RAM", fieldType: AdFieldType.SELECT, isRequired: false, isOptional: true, sortOrder: 7, options: ["1 GB", "2 GB", "3 GB", "4 GB", "6 GB", "8 GB", "12 GB", "16 GB"] },
            { fieldKey: "memory", label: "Memory", fieldType: AdFieldType.SELECT, isRequired: false, isOptional: true, sortOrder: 8, options: ["8 GB", "16 GB", "32 GB", "64 GB", "128 GB", "256 GB", "512 GB"] },
            { fieldKey: "camera", label: "No. of Cameras", fieldType: AdFieldType.RADIO, isRequired: false, isOptional: true, sortOrder: 9, options: ["Dual", "Triple", "Quad"] },
            { fieldKey: "screenSize", label: "Screen Size", fieldType: AdFieldType.SELECT, isRequired: false, isOptional: true, sortOrder: 10, options: ["Below 4 inches", "4 - 4.5 inches", "4.5 - 5 inches", "5 - 5.5 inches", "5.5 - 6 inches", "6 - 6.5 inches", "Above 6.5 inches"] },
            { fieldKey: "battery", label: "Battery", fieldType: AdFieldType.SELECT, isRequired: false, isOptional: true, sortOrder: 11, options: ["Below 2000 mAh", "2000–3000 mAh", "3000–4000 mAh", "4000–5000 mAh", "Above 5000 mAh"] },
            { fieldKey: "processor", label: "Processor", fieldType: AdFieldType.SELECT, isRequired: false, isOptional: true, sortOrder: 12, options: ["Snapdragon", "Exynos", "Helio", "Kirin", "Apple Bionic", "Other"] },
            { fieldKey: "network", label: "Network", fieldType: AdFieldType.RADIO, isRequired: false, isOptional: true, sortOrder: 13, options: ["4G", "5G", "VoLTE"] },
            { fieldKey: "simSupport", label: "SIM Support", fieldType: AdFieldType.RADIO, isRequired: false, isOptional: true, sortOrder: 14, options: ["Single SIM", "Dual SIM", "Dual VoLTE"] }
          ]
        },
        {
          name: "Mobile Phone Accessories",
          slug: "mobile-phone-accessories",
          sortOrder: 2,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Used", "Brand New"] },
            { fieldKey: "itemType", label: "Item type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 2, options: ["Charger", "Case / Cover", "Headset / Earphones", "Screen Protector", "Battery", "Cable", "Power Bank", "Bluetooth Speaker", "Other"] },
            { fieldKey: "brand", label: "Brand", fieldType: AdFieldType.SELECT, isRequired: false, isOptional: true, sortOrder: 3, options: ["Samsung", "Apple", "Anker", "Baseus", "Xiaomi", "Generic", "Other"] }
          ]
        },
        {
          name: "Mobile Spare Parts",
          slug: "mobile-spare-parts",
          sortOrder: 3,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Used", "Brand New"] },
            { fieldKey: "partType", label: "Part type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 2, options: ["Display / Screen", "Battery", "Housing / Back Cover", "Camera module", "Charging Port", "Motherboard", "Speaker / Mic", "Other"] }
          ]
        },
        {
          name: "Smart Watches & Fitness Bands",
          slug: "smartwatches-fitness",
          sortOrder: 4,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Used", "Brand New"] },
            { fieldKey: "itemType", label: "Item type", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 2, options: ["Smart Watches", "Fitness Bands"] },
            { fieldKey: "brand", label: "Brand", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 3, options: ["Apple", "Samsung", "Xiaomi / Amazfit", "Huawei", "Fitbit", "Garmin", "Other"] },
            { fieldKey: "features", label: "Features", fieldType: AdFieldType.CHECKBOX, isRequired: false, isOptional: true, sortOrder: 4, options: ["Heart Rate Monitor", "GPS", "Water Resistant", "Sleep Tracker", "Blood Oxygen Monitor", "NFC / Payments"] }
          ]
        }
      ]
    },
    {
      name: "Electronics",
      slug: "electronics",
      icon: "/images/categories/electronics.png",
      sortOrder: 2,
      subCategories: [
        {
          name: "Computers & Tablets",
          slug: "computers-tablets",
          sortOrder: 1,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Used", "Brand New"] },
            { fieldKey: "deviceType", label: "Device type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 2, options: ["Laptop / Netbook", "Chargers", "Storage", "Cable & Converters", "Desktop computer", "iPad", "Android Tablet", "Monitor", "Other"] },
            { fieldKey: "brand", label: "Brand", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 3, options: ["HP", "Dell", "Lenovo", "ASUS", "Acer", "Apple", "Samsung", "Toshiba", "MSI", "Other"] },
            { fieldKey: "processor", label: "Processor", fieldType: AdFieldType.SELECT, isRequired: false, isOptional: true, sortOrder: 4, options: ["Intel Core i3", "Intel Core i5", "Intel Core i7", "Intel Core i9", "AMD Ryzen 5", "AMD Ryzen 7", "Apple M1/M2/M3", "Other"] },
            { fieldKey: "ram", label: "RAM", fieldType: AdFieldType.SELECT, isRequired: false, isOptional: true, sortOrder: 5, options: ["4 GB", "8 GB", "16 GB", "32 GB", "64 GB"] }
          ]
        },
        {
          name: "Computer Accessories",
          slug: "computer-accessories",
          sortOrder: 2,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Used", "Brand New"] },
            { fieldKey: "itemType", label: "Item type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 2, options: ["Keyboard", "Mouse", "UPS", "Router", "Modem", "Printer / Scanner", "Speaker / Sound System", "Other"] },
            { fieldKey: "brand", label: "Brand", fieldType: AdFieldType.SELECT, isRequired: false, isOptional: true, sortOrder: 3, options: ["Logitech", "ASUS", "HP", "Dell", "Xiaomi", "A4Tech", "Prolink", "Huawei", "TP-Link", "Other"] }
          ]
        },
        {
          name: "TVs",
          slug: "tvs",
          sortOrder: 3,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Used", "Brand New"] },
            { fieldKey: "screenType", label: "Screen Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 2, options: ["LED", "LCD", "OLED", "QLED", "Smart TV", "CRT"] },
            { fieldKey: "brand", label: "Brand", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 3, options: ["Samsung", "LG", "Sony", "Panasonic", "TCL", "Innovex", "Abans", "Singer", "Hisense", "Xiaomi", "Other"] },
            { fieldKey: "screenSize", label: "Screen Size", fieldType: AdFieldType.SELECT, isRequired: false, isOptional: true, sortOrder: 4, options: ["Below 24\"", "24\"", "32\"", "40\"", "43\"", "50\"", "55\"", "65\"", "75\"", "Above 75\""] },
            { fieldKey: "model", label: "Model", fieldType: AdFieldType.TEXT, isRequired: false, isOptional: true, sortOrder: 5, placeholder: "e.g. Sony Bravia X80K" }
          ]
        },
        {
          name: "TV & Video Accessories",
          slug: "tv-video-accessories",
          sortOrder: 4,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Used", "Brand New"] },
            { fieldKey: "itemType", label: "Item type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 2, options: ["TV Mounts / Stands", "Setup Box / Decoder", "Remote Controller", "Media Player / TV Stick", "Cables & Connectors", "Other"] },
            { fieldKey: "brand", label: "Brand", fieldType: AdFieldType.SELECT, isRequired: false, isOptional: true, sortOrder: 3, options: ["Dialog", "Peo TV", "Xiaomi", "Apple", "Google", "Sony", "Generic", "Other"] }
          ]
        },
        {
          name: "Cameras & Camcorders",
          slug: "cameras",
          sortOrder: 5,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Used", "Brand New"] },
            { fieldKey: "cameraType", label: "Camera Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 2, options: ["DSLR", "Mirrorless", "Point & Shoot", "Action Camera", "Camcorder", "Other"] },
            { fieldKey: "brand", label: "Brand", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 3, options: ["Canon", "Nikon", "Sony", "Fujifilm", "GoPro", "Panasonic", "Leica", "Olympus", "Other"] }
          ]
        },
        {
          name: "Audio & MP3",
          slug: "audio-mp3",
          sortOrder: 6,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Used", "Brand New"] },
            { fieldKey: "itemType", label: "Item type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 2, options: ["Headphones / Earphones", "Bluetooth Speaker", "Home Theatre / Sound System", "Amplifier / Receiver", "Microphone", "MP3 / iPod Player", "Other"] },
            { fieldKey: "brand", label: "Brand", fieldType: AdFieldType.SELECT, isRequired: false, isOptional: true, sortOrder: 3, options: ["JBL", "Sony", "Bose", "Sennheiser", "Apple", "Xiaomi", "Pioneer", "JVC", "Harman Kardon", "Other"] }
          ]
        },
        {
          name: "Electronic Home Appliances",
          slug: "home-appliances",
          sortOrder: 7,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Used", "Brand New"] },
            { fieldKey: "itemType", label: "Item type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 2, options: ["Washing Machine", "Refrigerator / Fridge", "Microwave / Oven", "Blender / Mixer / Grinder", "Rice Cooker", "Iron", "Vacuum Cleaner", "Air Fryer / Cooker", "Other"] },
            { fieldKey: "brand", label: "Brand", fieldType: AdFieldType.SELECT, isRequired: false, isOptional: true, sortOrder: 3, options: ["LG", "Samsung", "Panasonic", "Innovex", "Singer", "Abans", "Sisil", "Philips", "Kenwood", "Tefal", "Other"] }
          ]
        },
        {
          name: "Air Conditions & Electrical fittings",
          slug: "electrical-fittings",
          sortOrder: 8,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Used", "Brand New"] },
            { fieldKey: "itemType", label: "Item type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 2, options: ["Air Conditioner", "Fan", "Light / Bulb", "Switch / Socket / Extension", "Generator / Inverter", "Electrical Wire / Cable", "Other"] },
            { fieldKey: "brand", label: "Brand", fieldType: AdFieldType.SELECT, isRequired: false, isOptional: true, sortOrder: 3, options: ["LG", "Panasonic", "Abans", "Singer", "Innovex", "Orange", "KDK", "Kevilton", "Havells", "Other"] }
          ]
        },
        {
          name: "Video Games & Consoles",
          slug: "video-games",
          sortOrder: 9,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Used", "Brand New"] },
            { fieldKey: "itemType", label: "Item type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 2, options: ["Game Console", "Video Game Disc / Cartridge", "Game Controller / Joystick", "VR Headset", "Console Accessory", "Other"] },
            { fieldKey: "brand", label: "Brand", fieldType: AdFieldType.SELECT, isRequired: false, isOptional: true, sortOrder: 3, options: ["Sony PlayStation", "Microsoft Xbox", "Nintendo", "Sega", "Other"] }
          ]
        },
        {
          name: "Other Electronics",
          slug: "other-electronics",
          sortOrder: 10,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Used", "Brand New"] },
            { fieldKey: "itemType", label: "Item type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 2, options: ["Solar Panel / System", "Inverter / Battery Backup", "Calculator", "Projector", "CCTV Camera / Security", "Other"] },
            { fieldKey: "brand", label: "Brand", fieldType: AdFieldType.SELECT, isRequired: false, isOptional: true, sortOrder: 3, options: ["Generic", "Sony", "Xiaomi", "Hikvision", "Dahua", "Other"] }
          ]
        }
      ]
    },
    {
      name: "Vehicles",
      slug: "vehicles",
      icon: "/images/categories/vehicles.png",
      sortOrder: 3,
      subCategories: [
        {
          name: "Cars",
          slug: "cars",
          sortOrder: 1,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Used", "Brand New", "Reconditioned", "Imported"] },
            { fieldKey: "brand", label: "Brand", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 2, options: ["Toyota", "Suzuki", "Honda", "Nissan", "Mitsubishi", "Hyundai", "Kia", "Mercedes-Benz", "BMW", "Audi", "Other"] },
            {
              fieldKey: "model",
              label: "Model",
              fieldType: AdFieldType.SELECT,
              isRequired: true,
              isOptional: false,
              sortOrder: 3,
              options: {
                Toyota: ["Corolla", "Premio", "Allion", "Vitz", "Prius", "Axio", "Aqua", "Belta", "Camry", "Yaris", "CH-R", "Land Cruiser", "Prado", "Other"],
                Suzuki: ["Alto", "Wagon R", "Swift", "Every", "Celerio", "Spacia", "Hustler", "Vitara", "Other"],
                Honda: ["Civic", "Fit", "Vezel", "Grace", "Insight", "Shuttle", "Accord", "CR-V", "Other"],
                Nissan: ["Sunny", "X-Trail", "Leaf", "March", "Dayz", "Bluebird", "Teana", "Other"],
                Mitsubishi: ["Lancer", "Montero", "Outlander", "Pajero", "L200", "Attrage", "Other"],
                Hyundai: ["Tucson", "Elantra", "Accent", "Santa Fe", "Grand i10", "Ioniq", "Other"],
                Kia: ["Sportage", "Sorento", "Picanto", "Rio", "Optima", "Stonic", "Other"],
                "Mercedes-Benz": ["C-Class", "E-Class", "S-Class", "CLA", "GLA", "GLC", "A-Class", "Other"],
                BMW: ["3 Series", "5 Series", "7 Series", "X1", "X3", "X5", "i3", "Other"],
                Audi: ["A3", "A4", "A5", "A6", "Q2", "Q3", "Q5", "Other"],
                Other: ["Other"]
              }
            },
            { fieldKey: "modelYear", label: "Year of Manufacture", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 4, options: Array.from({ length: 2026 - 1970 + 1 }, (_, i) => (2026 - i).toString()) },
            { fieldKey: "transmission", label: "Transmission", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 5, options: ["Automatic", "Manual", "Tiptronic", "Other"] },
            { fieldKey: "otherTransmission", label: "Other transmission", fieldType: AdFieldType.TEXT, isRequired: false, isOptional: true, sortOrder: 6, placeholder: "Specify transmission" },
            { fieldKey: "fuelType", label: "Fuel Type", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 7, options: ["Petrol", "Diesel", "Hybrid", "Electric"] },
            { fieldKey: "mileage", label: "Mileage (km)", fieldType: AdFieldType.NUMBER, isRequired: true, isOptional: false, sortOrder: 8, placeholder: "e.g. 75000" },
            { fieldKey: "engineCapacity", label: "Engine Capacity (cc)", fieldType: AdFieldType.NUMBER, isRequired: true, isOptional: false, sortOrder: 9, placeholder: "e.g. 1500" },
            { fieldKey: "trim", label: "Trim / Edition", fieldType: AdFieldType.TEXT, isRequired: false, isOptional: true, sortOrder: 10, placeholder: "Enter edition." },
            { fieldKey: "bodyType", label: "Body Type", fieldType: AdFieldType.SELECT, isRequired: false, isOptional: true, sortOrder: 11, options: ["Saloon", "Hatchback", "SUV / 4x4", "Station Wagon", "Coupe / Sports", "Other"] }
          ]
        },
        {
          name: "Motorbikes",
          slug: "motorbikes",
          sortOrder: 2,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Used", "Brand New", "Reconditioned"] },
            { fieldKey: "brand", label: "Brand", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 2, options: ["Yamaha", "Honda", "Bajaj", "TVS", "Suzuki", "Hero", "Vespa", "KTM", "Other"] },
            { fieldKey: "modelYear", label: "Model Year", fieldType: AdFieldType.NUMBER, isRequired: true, isOptional: false, sortOrder: 3, placeholder: "e.g. 2020" },
            { fieldKey: "mileage", label: "Mileage (km)", fieldType: AdFieldType.NUMBER, isRequired: true, isOptional: false, sortOrder: 4, placeholder: "e.g. 15000" },
            { fieldKey: "engineCapacity", label: "Engine Capacity (cc)", fieldType: AdFieldType.NUMBER, isRequired: true, isOptional: false, sortOrder: 5, placeholder: "e.g. 125" },
            { fieldKey: "trim", label: "Trim / Edition", fieldType: AdFieldType.TEXT, isRequired: false, isOptional: true, sortOrder: 6, placeholder: "Enter edition." }
          ]
        },
        {
          name: "Three Wheelers",
          slug: "three-wheelers",
          sortOrder: 3,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Used", "Brand New", "Reconditioned"] },
            { fieldKey: "brand", label: "Brand", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 2, options: ["Bajaj", "Piaggio", "TVS", "Mahindra", "Other"] },
            { fieldKey: "modelYear", label: "Model Year", fieldType: AdFieldType.NUMBER, isRequired: true, isOptional: false, sortOrder: 3, placeholder: "e.g. 2015" },
            { fieldKey: "mileage", label: "Mileage (km)", fieldType: AdFieldType.NUMBER, isRequired: true, isOptional: false, sortOrder: 4, placeholder: "e.g. 60000" },
            { fieldKey: "trim", label: "Trim / Edition", fieldType: AdFieldType.TEXT, isRequired: false, isOptional: true, sortOrder: 5, placeholder: "Enter edition." }
          ]
        },
        {
          name: "Bicycles",
          slug: "bicycles",
          sortOrder: 4,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Used", "Brand New", "Reconditioned"] },
            { fieldKey: "bicycleType", label: "Bicycle Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 2, options: ["Mountain Bike", "BMX", "Road Bike", "Hybrid Bike", "Kids Bike", "Other"] },
            { fieldKey: "brand", label: "Brand", fieldType: AdFieldType.SELECT, isRequired: false, isOptional: true, sortOrder: 3, options: ["Lumala", "Raleigh", "Giant", "Hero", "DSI", "Other"] }
          ]
        },
        {
          name: "Vans",
          slug: "vans",
          sortOrder: 5,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Used", "Brand New", "Reconditioned", "Imported"] },
            { fieldKey: "brand", label: "Brand", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 2, options: ["Toyota", "Nissan", "Suzuki", "Mazda", "Mitsubishi", "Other"] },
            {
              fieldKey: "model",
              label: "Model",
              fieldType: AdFieldType.SELECT,
              isRequired: true,
              isOptional: false,
              sortOrder: 3,
              options: {
                Toyota: ["HiAce", "TownAce", "LiteAce", "Noah", "Voxy", "Alphard", "Vellfire", "Regius", "KDH", "Other"],
                Nissan: ["Caravan", "Urvan", "NV200", "NV350", "Serena", "Vanette", "Other"],
                Suzuki: ["Carry", "Every", "APV", "Landy", "Other"],
                Mazda: ["Bongo", "Biante", "Flair", "Other"],
                Mitsubishi: ["Delica", "L300", "Minicab", "Other"],
                Other: ["Other"]
              }
            },
            { fieldKey: "modelYear", label: "Year of Manufacture", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 4, options: Array.from({ length: 2026 - 1970 + 1 }, (_, i) => (2026 - i).toString()) },
            { fieldKey: "mileage", label: "Mileage (km)", fieldType: AdFieldType.NUMBER, isRequired: true, isOptional: false, sortOrder: 5, placeholder: "e.g. 80000" },
            { fieldKey: "transmission", label: "Transmission", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 6, options: ["Automatic", "Manual", "Other"] },
            { fieldKey: "otherTransmission", label: "Other transmission", fieldType: AdFieldType.TEXT, isRequired: false, isOptional: true, sortOrder: 7, placeholder: "Specify transmission" },
            { fieldKey: "fuelType", label: "Fuel Type", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 8, options: ["Diesel", "Petrol", "Hybrid"] },
            { fieldKey: "trim", label: "Trim / Edition", fieldType: AdFieldType.TEXT, isRequired: false, isOptional: true, sortOrder: 9, placeholder: "Enter edition." }
          ]
        },
        {
          name: "Buses",
          slug: "buses",
          sortOrder: 6,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Used", "Brand New", "Reconditioned"] },
            { fieldKey: "brand", label: "Brand", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 2, options: ["Leyland", "Tata", "Isuzu", "Mitsubishi", "Toyota", "Nissan", "Other"] },
            { fieldKey: "modelYear", label: "Model Year", fieldType: AdFieldType.NUMBER, isRequired: true, isOptional: false, sortOrder: 3, placeholder: "e.g. 2012" },
            { fieldKey: "mileage", label: "Mileage (km)", fieldType: AdFieldType.NUMBER, isRequired: true, isOptional: false, sortOrder: 4, placeholder: "e.g. 150000" },
            { fieldKey: "trim", label: "Trim / Edition", fieldType: AdFieldType.TEXT, isRequired: false, isOptional: true, sortOrder: 5, placeholder: "Enter edition." }
          ]
        },
        {
          name: "Lorries & Trucks",
          slug: "lorries-trucks",
          sortOrder: 7,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Used", "Brand New", "Reconditioned"] },
            { fieldKey: "brand", label: "Brand", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 2, options: ["Isuzu", "Tata", "Mitsubishi", "Mahindra", "Toyota", "Nissan", "Daihatsu", "Other"] },
            { fieldKey: "modelYear", label: "Model Year", fieldType: AdFieldType.NUMBER, isRequired: true, isOptional: false, sortOrder: 3, placeholder: "e.g. 2015" },
            { fieldKey: "mileage", label: "Mileage (km)", fieldType: AdFieldType.NUMBER, isRequired: true, isOptional: false, sortOrder: 4, placeholder: "e.g. 120000" },
            { fieldKey: "trim", label: "Trim / Edition", fieldType: AdFieldType.TEXT, isRequired: false, isOptional: true, sortOrder: 5, placeholder: "Enter edition." }
          ]
        },
        {
          name: "Heavy Duty",
          slug: "heavy-duty",
          sortOrder: 8,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Used", "Brand New", "Reconditioned"] },
            { fieldKey: "vehicleType", label: "Vehicle Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 2, options: ["Excavator", "Forklift", "Roller", "Loader", "Crane", "Other"] },
            { fieldKey: "brand", label: "Brand", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 3, options: ["Caterpillar", "Komatsu", "JCB", "Toyota", "Hitachi", "Other"] },
            { fieldKey: "modelYear", label: "Model Year", fieldType: AdFieldType.NUMBER, isRequired: true, isOptional: false, sortOrder: 4, placeholder: "e.g. 2010" },
            { fieldKey: "trim", label: "Trim / Edition", fieldType: AdFieldType.TEXT, isRequired: false, isOptional: true, sortOrder: 5, placeholder: "Enter edition." }
          ]
        },
        {
          name: "Tractors",
          slug: "tractors",
          sortOrder: 9,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Used", "Brand New", "Reconditioned"] },
            { fieldKey: "brand", label: "Brand", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 2, options: ["Massey Ferguson", "Tafe", "Kubota", "Sonalika", "Mahindra", "John Deere", "Other"] },
            { fieldKey: "modelYear", label: "Model Year", fieldType: AdFieldType.NUMBER, isRequired: true, isOptional: false, sortOrder: 3, placeholder: "e.g. 2018" },
            { fieldKey: "trim", label: "Trim / Edition", fieldType: AdFieldType.TEXT, isRequired: false, isOptional: true, sortOrder: 4, placeholder: "Enter edition." }
          ]
        },
        {
          name: "Auto Services",
          slug: "auto-services",
          sortOrder: 10,
          fields: [
            { fieldKey: "serviceType", label: "Service Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 1, options: ["Vehicle Repair & Tuning", "Auto Detailing & Washing", "Air Conditioning", "Wheel Alignment", "Other"] }
          ]
        },
        {
          name: "Rentals",
          slug: "rentals",
          sortOrder: 11,
          fields: [
            { fieldKey: "rentalType", label: "Rental Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 1, options: ["Self Drive Rent", "Wedding Car Rent", "Commercial Vehicle Rent", "Vans / Buses for Rent", "Other"] }
          ]
        },
        {
          name: "Auto Parts & Accessories",
          slug: "auto-parts",
          sortOrder: 12,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Used", "Brand New", "Reconditioned"] },
            { fieldKey: "partType", label: "Part Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 2, options: ["Engine Parts", "Body Parts", "Wheels & Tyres", "Audio & Video Systems", "Car Care & Accessories", "Other"] },
            { fieldKey: "brand", label: "Brand", fieldType: AdFieldType.SELECT, isRequired: false, isOptional: true, sortOrder: 3, options: ["Toyota", "Nissan", "Honda", "Pioneer", "Michelin", "Other"] }
          ]
        },
        {
          name: "Maintenance and Repair",
          slug: "vehicle-maintenance",
          sortOrder: 13,
          fields: [
            { fieldKey: "serviceType", label: "Service Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 1, options: ["Mobile Mechanic", "Roadside Assistance", "Towing Service", "Spare Parts Delivery", "Other"] }
          ]
        },
        {
          name: "Boats & Water Transport",
          slug: "boats",
          sortOrder: 14,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Used", "Brand New", "Reconditioned"] },
            { fieldKey: "boatType", label: "Boat Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 2, options: ["Speed Boat", "Jet Ski", "Yacht", "Fishing Boat", "Motor Boat", "Other"] },
            { fieldKey: "brand", label: "Brand", fieldType: AdFieldType.SELECT, isRequired: false, isOptional: true, sortOrder: 3, options: ["Yamaha", "Sea-Doo", "Kawasaki", "Generic", "Other"] }
          ]
        }
      ]
    },
    {
      name: "Property",
      slug: "property",
      icon: "/images/categories/property.png",
      sortOrder: 4,
      subCategories: [
        {
          name: "Land For Sale",
          slug: "land",
          sortOrder: 1,
          fields: [
            { fieldKey: "landType", label: "Land Type", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Residential", "Commercial", "Agricultural", "Other"] },
            { fieldKey: "landSize", label: "Size", fieldType: AdFieldType.NUMBER, isRequired: true, isOptional: false, sortOrder: 2, placeholder: "Size of the land" },
            { fieldKey: "sizeUnit", label: "Unit", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 3, options: ["Perches", "Acres"] }
          ]
        },
        {
          name: "Houses For Sale",
          slug: "houses",
          sortOrder: 2,
          fields: [
            { fieldKey: "bedrooms", label: "Bedrooms", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 1, options: ["1", "2", "3", "4", "5", "5+"] },
            { fieldKey: "bathrooms", label: "Bathrooms", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 2, options: ["1", "2", "3", "4", "5", "5+"] },
            { fieldKey: "houseSize", label: "House size (sqft)", fieldType: AdFieldType.NUMBER, isRequired: true, isOptional: false, sortOrder: 3, placeholder: "e.g. 2000" },
            { fieldKey: "landSize", label: "Land size (perches)", fieldType: AdFieldType.NUMBER, isRequired: false, isOptional: true, sortOrder: 4, placeholder: "e.g. 10" }
          ]
        },
        {
          name: "Apartments For Sale",
          slug: "apartments",
          sortOrder: 3,
          fields: [
            { fieldKey: "bedrooms", label: "Bedrooms", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 1, options: ["1", "2", "3", "4", "5", "5+"] },
            { fieldKey: "bathrooms", label: "Bathrooms", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 2, options: ["1", "2", "3", "4", "5", "5+"] },
            { fieldKey: "houseSize", label: "Apartment size (sqft)", fieldType: AdFieldType.NUMBER, isRequired: true, isOptional: false, sortOrder: 3, placeholder: "e.g. 1200" },
            { fieldKey: "floorLevel", label: "Floor Level", fieldType: AdFieldType.NUMBER, isRequired: false, isOptional: true, sortOrder: 4, placeholder: "e.g. 3" }
          ]
        },
        {
          name: "Commercial Properties For Sale",
          slug: "commercial-properties",
          sortOrder: 4,
          fields: [
            { fieldKey: "propertyType", label: "Property Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 1, options: ["Office space", "Retail space", "Warehouse", "Hotel / Guest House", "Other"] },
            { fieldKey: "houseSize", label: "Property size (sqft)", fieldType: AdFieldType.NUMBER, isRequired: true, isOptional: false, sortOrder: 2, placeholder: "e.g. 3000" },
            { fieldKey: "landSize", label: "Land size (perches)", fieldType: AdFieldType.NUMBER, isRequired: false, isOptional: true, sortOrder: 3, placeholder: "e.g. 15" }
          ]
        }
      ]
    },
    {
      name: "Home & Garden",
      slug: "home-garden",
      icon: "/images/categories/home_garden.png",
      sortOrder: 5,
      subCategories: [
        {
          name: "Furniture",
          slug: "furniture",
          sortOrder: 1,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Used", "Brand New"] },
            { fieldKey: "furnitureType", label: "Furniture Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 2, options: ["Sofas & Couch", "Beds & Wardrobes", "Tables & Chairs", "TV Stands & Cabinets", "Office Furniture", "Other"] }
          ]
        },
        {
          name: "Bathroom & Sanitary ware",
          slug: "bathroom-sanitary",
          sortOrder: 2,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Used", "Brand New"] },
            { fieldKey: "itemType", label: "Item Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 2, options: ["Toilets / Commodes", "Wash Basins", "Taps & Showers", "Bathtubs", "Bathroom Accessories", "Other"] }
          ]
        },
        {
          name: "Garden",
          slug: "garden",
          sortOrder: 3,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Used", "Brand New"] },
            { fieldKey: "itemType", label: "Item Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 2, options: ["Plants & Seeds", "Garden Tools", "Lawn Mowers", "Pots & Planters", "Other"] }
          ]
        },
        {
          name: "Home Decor",
          slug: "home-decor",
          sortOrder: 4,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Used", "Brand New"] },
            { fieldKey: "itemType", label: "Item Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 2, options: ["Clocks & Wall Art", "Curtains & Blinds", "Carpets & Rugs", "Lighting / Lamps", "Mirrors", "Other"] }
          ]
        },
        {
          name: "Kitchen items",
          slug: "kitchen-items",
          sortOrder: 5,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Used", "Brand New"] },
            { fieldKey: "itemType", label: "Item Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 2, options: ["Cookware & Pots", "Cutlery & Tableware", "Kitchen Organizers", "Gas Cookers", "Water Filters", "Other"] }
          ]
        },
        {
          name: "Other Home Items",
          slug: "other-home-items",
          sortOrder: 6,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Used", "Brand New"] },
            { fieldKey: "itemType", label: "Item Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 2, options: ["Cleaning Supplies", "Hardware Tools", "Sewing Machines", "Other"] }
          ]
        }
      ]
    },
    {
      name: "Animals",
      slug: "animals",
      icon: "/images/categories/animals.png",
      sortOrder: 6,
      subCategories: [
        {
          name: "Pets",
          slug: "pets",
          sortOrder: 1,
          fields: [
            { fieldKey: "petType", label: "Type of Pet", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 1, options: ["Dogs", "Cats", "Birds", "Fish", "Rabbits", "Other"] },
            { fieldKey: "breed", label: "Breed", fieldType: AdFieldType.TEXT, isRequired: false, isOptional: true, sortOrder: 2, placeholder: "e.g. German Shepherd" },
            { fieldKey: "age", label: "Age (months)", fieldType: AdFieldType.NUMBER, isRequired: false, isOptional: true, sortOrder: 3, placeholder: "e.g. 6" }
          ]
        },
        {
          name: "Pet Food",
          slug: "pet-food",
          sortOrder: 2,
          fields: [
            { fieldKey: "foodType", label: "Food Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 1, options: ["Dog Food", "Cat Food", "Bird Feed", "Fish Food", "Other"] },
            { fieldKey: "brand", label: "Brand", fieldType: AdFieldType.SELECT, isRequired: false, isOptional: true, sortOrder: 2, options: ["Royal Canin", "Drools", "Pedigree", "Whiskas", "Other"] }
          ]
        },
        {
          name: "Veterinary Services",
          slug: "vet-services",
          sortOrder: 3,
          fields: [
            { fieldKey: "serviceType", label: "Service Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 1, options: ["Clinic Checkup", "Vaccination", "Pet Grooming", "Pet Surgery", "Other"] }
          ]
        },
        {
          name: "Farm Animals",
          slug: "farm-animals",
          sortOrder: 4,
          fields: [
            { fieldKey: "animalType", label: "Animal Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 1, options: ["Cows & Bulls", "Goats & Sheep", "Poultry / Chicken", "Pigs", "Other"] }
          ]
        },
        {
          name: "Animal Accessories",
          slug: "animal-accessories",
          sortOrder: 5,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Used", "Brand New"] },
            { fieldKey: "accessoryType", label: "Accessory Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 2, options: ["Cages & Kennels", "Leashes & Collars", "Aquariums & Pumps", "Toys & Accessories", "Other"] }
          ]
        },
        {
          name: "Other Animals",
          slug: "other-animals",
          sortOrder: 6,
          fields: [
            { fieldKey: "animalType", label: "Animal Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 1, options: ["Horses", "Turtles", "Other"] }
          ]
        }
      ]
    },
    {
      name: "Services",
      slug: "services",
      icon: "/images/categories/services.png",
      sortOrder: 7,
      subCategories: [
        {
          name: "Trade Services",
          slug: "trade-services",
          sortOrder: 1,
          fields: [
            { fieldKey: "serviceType", label: "Service Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 1, options: ["Plumbing", "Electrical / Wiring", "Carpentry / Furniture Repair", "Masonry / Construction", "Painting", "Other"] }
          ]
        },
        {
          name: "Domestic Services",
          slug: "domestic-services",
          sortOrder: 2,
          fields: [
            { fieldKey: "serviceType", label: "Service Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 1, options: ["Home Cleaning", "Baby Sitting / Nanny", "Laundry / Dry Clean", "Elderly Care", "Other"] }
          ]
        },
        {
          name: "Events & Entertainment",
          slug: "events-entertainment",
          sortOrder: 3,
          fields: [
            { fieldKey: "serviceType", label: "Service Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 1, options: ["Photography & Videography", "DJ & Sound System", "Catering & Foods", "Event Planning / Decor", "Other"] }
          ]
        },
        {
          name: "Health & Wellbeing",
          slug: "health-wellbeing",
          sortOrder: 4,
          fields: [
            { fieldKey: "serviceType", label: "Service Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 1, options: ["Personal Training", "Yoga & Meditation", "Massage & Spa", "Physiotherapy", "Other"] }
          ]
        },
        {
          name: "Travel & Tourism",
          slug: "travel-tourism",
          sortOrder: 5,
          fields: [
            { fieldKey: "serviceType", label: "Service Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 1, options: ["Tour Packages", "Visa Consulting", "Vehicle Rental with Driver", "Hotel / Villa Booking", "Other"] }
          ]
        },
        {
          name: "Other Services",
          slug: "other-services",
          sortOrder: 6,
          fields: [
            { fieldKey: "serviceType", label: "Service Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 1, options: ["Writing & Translation", "Legal Consulting", "Accounting & Tax", "Tailoring", "Other"] }
          ]
        }
      ]
    },
    {
      name: "Business & Industry",
      slug: "business-industry",
      icon: "/images/categories/business_industry.png",
      sortOrder: 8,
      subCategories: [
        {
          name: "Office Equipment, Supplies & Stationery",
          slug: "office-equipment-supplies",
          sortOrder: 1,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Used", "Brand New"] },
            { fieldKey: "itemType", label: "Item Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 2, options: ["Printers & Scanners", "Photocopiers", "Office Furniture", "Stationery", "Other"] }
          ]
        },
        {
          name: "Solar & Generators",
          slug: "solar-generators",
          sortOrder: 2,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Used", "Brand New"] },
            { fieldKey: "itemType", label: "Item Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 2, options: ["Solar Panels", "Generators", "Inverters", "Solar Batteries", "Other"] }
          ]
        },
        {
          name: "Industry Tools & Machinery",
          slug: "industry-machinery",
          sortOrder: 3,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Used", "Brand New"] },
            { fieldKey: "itemType", label: "Item Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 2, options: ["Power Tools", "Hand Tools", "Heavy Machinery", "Safety Equipment", "Other"] }
          ]
        },
        {
          name: "Raw Materials & Wholesale Lots",
          slug: "raw-materials",
          sortOrder: 4,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Used", "Brand New"] },
            { fieldKey: "itemType", label: "Item Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 2, options: ["Wholesale Lots", "Fabric & Textile", "Construction Materials", "Chemicals", "Other"] }
          ]
        },
        {
          name: "Licences & Titles",
          slug: "licences-titles",
          sortOrder: 5,
          fields: [
            { fieldKey: "licenceType", label: "Licence Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 1, options: ["Business Licence", "Liquor Licence", "Vehicle Permit", "Other"] }
          ]
        },
        {
          name: "Healthcare, Medical Equipment & Supplies",
          slug: "medical-equipment",
          sortOrder: 6,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Used", "Brand New"] },
            { fieldKey: "itemType", label: "Item Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 2, options: ["Medical Devices", "Surgical Supplies", "Wellness Products", "Other"] }
          ]
        },
        {
          name: "Building Material & Tools",
          slug: "building-materials",
          sortOrder: 7,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Used", "Brand New"] },
            { fieldKey: "itemType", label: "Item Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 2, options: ["Cement & Bricks", "Bathroom Fittings", "Plumbing Supplies", "Electrical Items", "Paint & Wallpapers", "Other"] }
          ]
        },
        {
          name: "Other Business Services",
          slug: "other-business-services",
          sortOrder: 8,
          fields: [
            { fieldKey: "serviceType", label: "Service Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 1, options: ["Consulting", "Marketing", "Security Service", "Logistics & Transport", "Other"] }
          ]
        }
      ]
    },
    {
      name: "Hobby, Sport & Kids",
      slug: "hobby-sport-kids",
      icon: "/images/categories/hobby_sport.png",
      sortOrder: 9,
      subCategories: [
        {
          name: "Musical Instruments",
          slug: "musical-instruments",
          sortOrder: 1,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Used", "Brand New"] },
            { fieldKey: "instrumentType", label: "Instrument Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 2, options: ["Guitar", "Keyboard / Piano", "Drums / Percussion", "Violin", "Wind Instruments", "Other"] },
            { fieldKey: "brand", label: "Brand", fieldType: AdFieldType.SELECT, isRequired: false, isOptional: true, sortOrder: 3, options: ["Yamaha", "Fender", "Casio", "Gibson", "Roland", "Other"] }
          ]
        },
        {
          name: "Sports & Fitness",
          slug: "sports-fitness",
          sortOrder: 2,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Used", "Brand New"] },
            { fieldKey: "itemType", label: "Item Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 2, options: ["Treadmills", "Dumbbells & Weights", "Bicycle Accessories", "Sports Wear", "Other"] }
          ]
        },
        {
          name: "Sports Supplements",
          slug: "sports-supplements",
          sortOrder: 3,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Brand New"] },
            { fieldKey: "supplementType", label: "Supplement Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 2, options: ["Whey Protein", "Creatine", "Mass Gainer", "Pre-Workout", "Vitamins", "Other"] },
            { fieldKey: "brand", label: "Brand", fieldType: AdFieldType.SELECT, isRequired: false, isOptional: true, sortOrder: 3, options: ["Optimum Nutrition", "MuscleTech", "MyProtein", "GNC", "Other"] }
          ]
        },
        {
          name: "Travel, Events & Tickets",
          slug: "travel-tickets",
          sortOrder: 4,
          fields: [
            { fieldKey: "eventType", label: "Event / Ticket Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 1, options: ["Concert Tickets", "Movie Tickets", "Holiday Packages", "Flight Tickets", "Other"] }
          ]
        },
        {
          name: "Art & Collectibles",
          slug: "art-collectibles",
          sortOrder: 5,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Used", "Brand New"] },
            { fieldKey: "itemType", label: "Item Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 2, options: ["Paintings & Drawings", "Antiques", "Stamps & Coins", "Handicrafts", "Other"] }
          ]
        },
        {
          name: "Music, Books & Movies",
          slug: "music-books-movies",
          sortOrder: 6,
          fields: [
            { fieldKey: "itemType", label: "Item Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 1, options: ["Textbooks", "Novels & Fiction", "Audio CDs / Vinyl", "Movie DVDs / Blu-ray", "Other"] }
          ]
        },
        {
          name: "Children's Items",
          slug: "childrens-items",
          sortOrder: 7,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Used", "Brand New"] },
            { fieldKey: "itemType", label: "Item Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 2, options: ["Toys", "Baby Clothing", "Strollers & Prams", "Baby Feeders & Accessories", "Other"] }
          ]
        },
        {
          name: "Other Hobby, Sport & Kids Items",
          slug: "other-hobby-items",
          sortOrder: 8,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Used", "Brand New"] },
            { fieldKey: "itemType", label: "Item Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 2, options: ["Board Games", "Video Game Merchandise", "Collectibles", "Other"] }
          ]
        }
      ]
    },
    {
      name: "Fashion & Beauty",
      slug: "fashion-beauty",
      icon: "/images/categories/fashion_beauty.png",
      sortOrder: 10,
      subCategories: [
        {
          name: "Bags & Luggage",
          slug: "bags-luggage",
          sortOrder: 1,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Used", "Brand New"] },
            { fieldKey: "bagType", label: "Bag Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 2, options: ["Backpack", "Handbag", "Luggage / Suitcase", "Wallet / Purse", "Other"] },
            { fieldKey: "brand", label: "Brand", fieldType: AdFieldType.SELECT, isRequired: false, isOptional: true, sortOrder: 3, options: ["Samsonite", "Nike", "Adidas", "Gucci", "Generic", "Other"] }
          ]
        },
        {
          name: "Clothing",
          slug: "clothing",
          sortOrder: 2,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Used", "Brand New"] },
            { fieldKey: "gender", label: "Gender", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 2, options: ["Men's", "Women's", "Unisex", "Kids"] },
            { fieldKey: "itemType", label: "Item Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 3, options: ["T-Shirts", "Shirts", "Pants / Jeans", "Dresses / Frocks", "Sarees", "Other"] }
          ]
        },
        {
          name: "Shoes & Footwear",
          slug: "shoes-footwear",
          sortOrder: 3,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Used", "Brand New"] },
            { fieldKey: "gender", label: "Gender", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 2, options: ["Men's", "Women's", "Unisex", "Kids"] },
            { fieldKey: "shoeType", label: "Shoe Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 3, options: ["Sneakers", "Formal Shoes", "Sandals / Slippers", "Heels", "Sports Shoes", "Other"] }
          ]
        },
        {
          name: "Jewellery",
          slug: "jewellery",
          sortOrder: 4,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Used", "Brand New"] },
            { fieldKey: "itemType", label: "Item Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 2, options: ["Necklaces", "Rings", "Earrings", "Bracelets", "Other"] },
            { fieldKey: "material", label: "Material", fieldType: AdFieldType.SELECT, isRequired: false, isOptional: true, sortOrder: 3, options: ["Gold", "Silver", "Platinum", "Gemstones", "Other"] }
          ]
        },
        {
          name: "Sunglasses & Opticians",
          slug: "sunglasses-opticians",
          sortOrder: 5,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Used", "Brand New"] },
            { fieldKey: "itemType", label: "Item Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 2, options: ["Sunglasses", "Prescription Frames", "Contact Lenses", "Other"] },
            { fieldKey: "brand", label: "Brand", fieldType: AdFieldType.SELECT, isRequired: false, isOptional: true, sortOrder: 3, options: ["Ray-Ban", "Oakley", "Gucci", "Polaroid", "Generic", "Other"] }
          ]
        },
        {
          name: "Watches",
          slug: "watches",
          sortOrder: 6,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Used", "Brand New"] },
            { fieldKey: "watchType", label: "Watch Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 2, options: ["Analog", "Digital", "Smartwatch (Basic)", "Chronograph", "Other"] },
            { fieldKey: "brand", label: "Brand", fieldType: AdFieldType.SELECT, isRequired: false, isOptional: true, sortOrder: 3, options: ["Casio", "Seiko", "Citizen", "Rolex", "Tissot", "Apple", "Samsung", "Other"] }
          ]
        },
        {
          name: "Other Fashion Accessories",
          slug: "fashion-accessories",
          sortOrder: 7,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Used", "Brand New"] },
            { fieldKey: "itemType", label: "Item Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 2, options: ["Belts", "Hats / Caps", "Socks", "Scarves", "Other"] }
          ]
        },
        {
          name: "Beauty Products",
          slug: "beauty-products",
          sortOrder: 8,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Brand New", "Used"] },
            { fieldKey: "itemType", label: "Item Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 2, options: ["Makeup", "Skincare", "Perfumes / Fragrances", "Hair Care", "Other"] },
            { fieldKey: "brand", label: "Brand", fieldType: AdFieldType.SELECT, isRequired: false, isOptional: true, sortOrder: 3, options: ["L'Oreal", "MAC", "Victoria's Secret", "Maybelline", "Other"] }
          ]
        },
        {
          name: "Other Personal Items",
          slug: "other-personal-items",
          sortOrder: 9,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Used", "Brand New"] },
            { fieldKey: "itemType", label: "Item Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 2, options: ["Umbrellas", "Keychains", "Gifts", "Other"] }
          ]
        }
      ]
    },
    {
      name: "Essentials",
      slug: "essentials",
      icon: "/images/categories/essentials.png",
      sortOrder: 11,
      subCategories: [
        {
          name: "Grocery & Essentials",
          slug: "grocery-essentials",
          sortOrder: 1,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Brand New"] },
            { fieldKey: "itemType", label: "Item Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 2, options: ["Rice & Flour", "Spices", "Beverages", "Snacks", "Other"] }
          ]
        }
      ]
    },
    {
      name: "Education",
      slug: "education",
      icon: "/images/categories/education.png",
      sortOrder: 12,
      subCategories: [
        {
          name: "Higher Education",
          slug: "higher-education",
          sortOrder: 1,
          fields: [
            { fieldKey: "courseType", label: "Course Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 1, options: ["Degrees", "Diplomas", "Professional Qualifications", "Other"] }
          ]
        },
        {
          name: "Textbooks",
          slug: "textbooks",
          sortOrder: 2,
          fields: [
            { fieldKey: "subject", label: "Subject", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 1, options: ["Mathematics", "Science", "History", "ICT", "Languages", "Other"] }
          ]
        },
        {
          name: "Tuition",
          slug: "tuition",
          sortOrder: 3,
          fields: [
            { fieldKey: "subject", label: "Subject", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 1, options: ["AL Combined Maths", "AL Physics", "AL Chemistry", "OL Science", "OL Maths", "Other"] },
            { fieldKey: "classType", label: "Class Type", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 2, options: ["Individual", "Group class", "Online class"] }
          ]
        },
        {
          name: "Vocational Institutes",
          slug: "vocational-institutes",
          sortOrder: 4,
          fields: [
            { fieldKey: "courseType", label: "Course Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 1, options: ["Mechanical", "Electrical", "Cooking", "Sewing", "Other"] }
          ]
        },
        {
          name: "Other Education",
          slug: "other-education",
          sortOrder: 5,
          fields: [
            { fieldKey: "itemType", label: "Item Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 1, options: ["Educational CDs", "Short Courses", "Other"] }
          ]
        }
      ]
    },
    {
      name: "Agriculture",
      slug: "agriculture",
      icon: "/images/categories/agriculture.png",
      sortOrder: 13,
      subCategories: [
        {
          name: "Crops, Seeds & Plants",
          slug: "crops-seeds",
          sortOrder: 1,
          fields: [
            { fieldKey: "plantType", label: "Plant / Crop Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 1, options: ["Fruits", "Vegetables", "Flowers & Ornamental", "Farming Seeds", "Other"] }
          ]
        },
        {
          name: "Farming Tools & Machinery",
          slug: "farming-machinery",
          sortOrder: 2,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Used", "Brand New"] },
            { fieldKey: "itemType", label: "Machinery Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 2, options: ["Water Pumps", "Grass Cutters", "Tractor Attachments", "Sprayers", "Other"] }
          ]
        },
        {
          name: "Other Agriculture",
          slug: "other-agriculture",
          sortOrder: 3,
          fields: [
            { fieldKey: "itemType", label: "Item Type", fieldType: AdFieldType.SELECT, isRequired: true, isOptional: false, sortOrder: 1, options: ["Fertilizers", "Pesticides", "Animal Feed", "Other"] }
          ]
        }
      ]
    },
    {
      name: "Other",
      slug: "other",
      icon: "/images/categories/other.png",
      sortOrder: 14,
      subCategories: [
        {
          name: "Other Items",
          slug: "other-items",
          sortOrder: 1,
          fields: [
            { fieldKey: "condition", label: "Condition", fieldType: AdFieldType.RADIO, isRequired: true, isOptional: false, sortOrder: 1, options: ["Used", "Brand New"] }
          ]
        }
      ]
    }
  ];

  for (const cat of categoriesData) {
    const dbCat = await prisma.adsCategory.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        icon: cat.icon,
        sortOrder: cat.sortOrder
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        sortOrder: cat.sortOrder
      }
    });

    for (const sub of cat.subCategories) {
      const dbSub = await prisma.adsSubCategory.upsert({
        where: {
          categoryId_slug: {
            categoryId: dbCat.id,
            slug: sub.slug
          }
        },
        update: {
          name: sub.name,
          sortOrder: sub.sortOrder
        },
        create: {
          categoryId: dbCat.id,
          name: sub.name,
          slug: sub.slug,
          sortOrder: sub.sortOrder
        }
      });

      // Clear existing field definitions to avoid duplicates on re-seed
      await prisma.adFieldDefinition.deleteMany({
        where: { subCategoryId: dbSub.id }
      });

      for (const f of sub.fields) {
        const field = f as any;
        await prisma.adFieldDefinition.create({
          data: {
            subCategoryId: dbSub.id,
            fieldKey: field.fieldKey,
            label: field.label,
            fieldType: field.fieldType,
            options: field.options ? (field.options as any) : undefined,
            isRequired: field.isRequired,
            isOptional: field.isOptional,
            sortOrder: field.sortOrder,
            placeholder: field.placeholder || null
          }
        });
      }
    }
  }

  console.log("✅ Ads categories, subcategories, and field definitions seeded successfully.");

  console.log("🎉 Database seed completed!");
  console.log("");
  console.log("📋 Admin Login Credentials:");
  console.log("   Email: admin@primewear.lk");
  console.log("   Password: admin123");
  console.log("");
  console.log("⚠️  Remember to change the admin password in production!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });

/* FITTRACK 12 - offline nutrition reference + meal-description parser.
   All values are APPROXIMATE reference values per 100 g (or 100 ml) of food as normally eaten
   (cooked where applicable), compiled from typical IFCT / USDA-style figures. They are estimates,
   not laboratory measurements. Real foods vary with recipe, brand, oil/ghee used and portion size. */
(function(root){
"use strict";

/* order of the numbers in every food row */
const NUTS=[
 ["calories","Calories","kcal"],["protein","Protein","g"],["carbs","Carbohydrates","g"],["fat","Fat","g"],
 ["fibre","Fibre","g"],["calcium","Calcium","mg"],["iron","Iron","mg"],["potassium","Potassium","mg"],
 ["sodium","Sodium","mg"],["magnesium","Magnesium","mg"],["vitC","Vitamin C","mg"]
];
const NKEYS=NUTS.map(n=>n[0]);

/* F(id, display name, "alias|alias", [kcal,P,C,F,fibre,Ca,Fe,K,Na,Mg,VitC], {unit:grams}, [defaultQty, defaultUnit]) */
const FOODS=[];
function F(id,name,al,v,u,d){FOODS.push({id,name,al:(al||"").split("|").filter(Boolean),v,u:u||{},d:d||[100,"g"]})}

/* ---- Indian staples ---- */
F("roti","Roti / chapati (whole wheat)","roti|chapati|chapatti|phulka|rotis|fulka",[297,9.6,52,5.5,4.5,30,3.5,230,120,60,0],{piece:40},[1,"piece"]);
F("paratha","Paratha (plain)","paratha|parantha|plain paratha",[326,7,45,13,3.5,35,2.5,200,330,45,0],{piece:80},[1,"piece"]);
F("puri","Puri (fried)","puri|poori",[350,7,45,17,2.5,25,2,150,200,40,0],{piece:30},[2,"piece"]);
F("naan","Naan","naan|nan",[310,9.6,50,5.1,2,60,2.5,130,500,25,0],{piece:90},[1,"piece"]);
F("rice","Rice (white, cooked)","rice|white rice|steamed rice|cooked rice|chawal|plain rice",[130,2.7,28,0.3,0.4,10,0.5,35,1,12,0],{bowl:180,katori:150,cup:160,plate:250},[1,"bowl"]);
F("brownrice","Brown rice (cooked)","brown rice",[123,2.7,25.6,1,1.6,10,0.6,79,4,39,0],{bowl:180,katori:150,cup:160,plate:250},[1,"bowl"]);
F("pulao","Veg pulao / jeera rice","pulao|pulav|jeera rice|veg pulao|fried rice",[150,3,25,4,1.5,20,0.8,70,250,20,1],{bowl:180,katori:150,plate:250},[1,"bowl"]);
F("biryani","Chicken biryani","biryani|chicken biryani|biriyani",[170,8,22,5.5,1,25,1,150,380,20,1],{plate:300,bowl:220},[1,"plate"]);
F("khichdi","Khichdi (dal-rice)","khichdi|khichri",[120,4.2,20,2.5,2,20,1,140,220,25,1],{bowl:200,katori:150,plate:250},[1,"bowl"]);
F("dal","Dal (cooked, tadka)","dal|daal|dhal|dal tadka|dal fry|toor dal|arhar dal|moong dal|masoor dal|lentil|lentils|dal curry",[105,5.5,14,3,3.5,30,1.5,250,220,40,2],{bowl:200,katori:150,cup:240,plate:250},[1,"bowl"]);
F("dalmakhani","Dal makhani","dal makhani|makhani dal|black dal",[140,6,14,6.5,4,40,1.8,260,260,40,1],{bowl:200,katori:150},[1,"bowl"]);
F("rajma","Rajma (kidney bean curry)","rajma|kidney beans|rajma curry",[120,6.5,17,3,5,40,2,300,250,40,1],{bowl:200,katori:150,plate:250},[1,"bowl"]);
F("chole","Chole (chickpea curry)","chole|chana masala|chhole|chickpea curry",[150,6.5,19,5.5,6,50,2.2,300,300,40,1],{bowl:200,katori:150,plate:250},[1,"bowl"]);
F("chana","Boiled chickpeas / kala chana","chana|chickpeas|boiled chana|kala chana|boiled chickpeas",[164,8.9,27,2.6,7.6,49,2.9,291,7,48,1],{bowl:150,katori:100,cup:160,handful:40},[1,"bowl"]);
F("sambar","Sambar","sambar|sambhar",[55,2.7,7,1.8,1.8,35,1,200,250,25,3],{bowl:200,katori:150,cup:240},[1,"bowl"]);
F("sabzi","Mixed vegetable curry (sabzi)","sabzi|sabji|veg curry|vegetable curry|mixed veg curry|subzi",[80,2,8,4.5,2.5,30,0.9,250,230,20,6],{bowl:150,katori:120,plate:200},[1,"bowl"]);
F("aloosabzi","Aloo sabzi (potato curry)","aloo sabzi|aloo curry|potato curry|aloo ki sabzi|aloo gobi",[105,2,15,4.5,2,10,0.7,300,220,20,8],{bowl:150,katori:120},[1,"bowl"]);
F("paneercurry","Paneer curry / bhurji","paneer curry|paneer butter masala|paneer masala|palak paneer|paneer bhurji|matar paneer|shahi paneer|kadai paneer",[225,10.5,7,17,1.5,200,1,200,330,20,3],{bowl:150,katori:120,plate:200},[1,"bowl"]);
F("chickencurry","Chicken curry","chicken curry|curry chicken|butter chicken|chicken masala",[150,14,4,8.5,0.8,20,1.2,230,300,22,2],{bowl:200,katori:150,piece:80,plate:250},[1,"bowl"]);
F("fishcurry","Fish curry","fish curry|fish masala",[120,13,3,6,0.5,40,1,280,280,28,2],{bowl:200,katori:150,piece:80},[1,"bowl"]);
F("eggcurry","Egg curry","egg curry|anda curry",[130,8,4,9,1,45,1.4,160,300,12,2],{bowl:200,katori:150},[1,"bowl"]);
F("raita","Raita","raita|boondi raita|cucumber raita",[55,2.8,4.8,2.7,0.3,100,0.1,140,140,11,2],{bowl:100,katori:100,cup:200},[1,"katori"]);
F("idli","Idli","idli|idly|idlis",[133,4,27,0.4,1,15,0.6,80,150,20,0],{piece:40},[2,"piece"]);
F("dosa","Dosa (plain)","dosa|plain dosa|dosai|dosas",[168,3.9,29,3.7,1.2,20,1,110,200,20,0],{piece:90},[1,"piece"]);
F("masaladosa","Masala dosa","masala dosa",[200,4.5,27,8,2,25,1.2,200,280,22,3],{piece:160},[1,"piece"]);
F("poha","Poha","poha|pohe|flattened rice",[135,2.7,25,2.5,1.5,15,2,100,280,20,2],{plate:200,bowl:180,katori:120},[1,"plate"]);
F("upma","Upma","upma|rava upma|suji upma",[150,3.5,22,5.5,1.5,15,1,90,300,20,1],{plate:200,bowl:180,katori:120},[1,"plate"]);
F("besanchilla","Besan chilla","besan chilla|chilla|cheela|besan cheela|moong chilla",[180,8,20,7,4,40,2.5,260,220,50,1],{piece:70},[2,"piece"]);
F("samosa","Samosa","samosa|samosas",[262,4,30,14,2,20,1.3,200,350,20,1],{piece:60},[1,"piece"]);
F("pakora","Pakora / bhajiya","pakora|pakoda|bhajiya|bhaji|pakoras",[300,7,28,18,3,40,2,250,400,35,2],{piece:25,plate:120},[4,"piece"]);
F("sattu","Sattu powder","sattu|sattu powder",[385,22,60,5.5,13,100,5,700,10,100,0],{tbsp:12,glass:30},[2,"tbsp"]);

/* ---- Dairy, eggs, meat, fish, protein ---- */
F("paneer","Paneer","paneer|cottage cheese|panir|paneer cubes",[296,18,3.4,22,0,300,0.5,100,30,15,0],{piece:20,slice:25,cup:150,bowl:150},[100,"g"]);
F("tofu","Tofu","tofu|bean curd",[76,8,1.9,4.8,0.3,350,5.4,121,7,30,0],{piece:30,slice:30,cup:250},[100,"g"]);
F("milk","Milk (toned / cow)","milk|toned milk|cow milk|doodh|full cream milk|whole milk",[62,3.2,4.8,3.3,0,120,0.1,150,45,11,1],{glass:250,cup:240,katori:100},[1,"glass"]);
F("curd","Curd / dahi (plain)","curd|dahi|yogurt|yoghurt|plain curd",[61,3.5,4.7,3.3,0,120,0.1,155,46,12,1],{bowl:150,katori:100,cup:245,tbsp:15},[1,"katori"]);
F("greekyogurt","Greek yogurt (plain)","greek yogurt|greek yoghurt|hung curd",[73,10,3.9,1.9,0,100,0.1,141,34,11,0],{bowl:150,katori:100,cup:245},[1,"bowl"]);
F("chaas","Buttermilk (chaas)","chaas|buttermilk|chhaas|mattha",[35,2.5,4,1,0,110,0.1,130,100,10,1],{glass:250,cup:240},[1,"glass"]);
F("lassi","Lassi (sweet)","lassi|sweet lassi",[75,2.8,12,1.6,0,95,0.1,130,40,10,1],{glass:250,cup:240},[1,"glass"]);
F("cheese","Cheese (cheddar)","cheese|cheddar|cheddar cheese",[403,25,1.3,33,0,720,0.7,98,621,28,0],{slice:20,cube:20,tbsp:8},[1,"slice"]);
F("cheeseslice","Cheese slice (processed)","cheese slice|processed cheese|amul cheese",[320,18,5,25,0,600,0.3,150,1300,25,0],{slice:20},[1,"slice"]);
F("egg","Egg (whole, boiled)","egg|eggs|boiled egg|boiled eggs|anda|whole egg",[155,12.6,1.1,10.6,0,50,1.2,126,124,10,0],{piece:50},[1,"piece"]);
F("eggwhite","Egg white","egg white|egg whites|white of egg",[52,10.9,0.7,0.2,0,7,0.1,163,166,11,0],{piece:33},[3,"piece"]);
F("omelette","Omelette (cooked in oil)","omelette|omelet|egg omelette",[154,10.5,1,11.7,0,50,1.4,140,150,11,0],{piece:60},[2,"piece"]);
F("chickenbreast","Chicken breast (cooked)","chicken breast|grilled chicken|boiled chicken|chicken|roast chicken|chicken fillet",[165,31,0,3.6,0,15,1,256,74,29,0],{piece:120,cup:140},[100,"g"]);
F("chickenthigh","Chicken thigh / leg (cooked)","chicken thigh|chicken leg|chicken drumstick|drumstick",[190,25,0,9,0,12,1.1,240,90,22,0],{piece:90},[100,"g"]);
F("tandoori","Tandoori chicken / tikka","tandoori chicken|chicken tikka|tikka|chicken tandoori",[160,24,3,5.5,0.3,25,1.2,230,350,22,1],{piece:100},[100,"g"]);
F("mutton","Mutton (cooked)","mutton|lamb|goat meat|mutton curry",[250,25,0,16,0,15,2.5,300,80,22,0],{piece:80,bowl:150},[100,"g"]);
F("fish","Fish (cooked)","fish|rohu|fish fry|grilled fish|basa|tilapia|pomfret|fish fillet",[140,22,0,5,0,35,0.8,350,70,30,0],{piece:100},[100,"g"]);
F("salmon","Salmon (cooked)","salmon",[206,22,0,12,0,12,0.3,384,60,29,0],{piece:120},[100,"g"]);
F("tuna","Tuna (canned in water)","tuna|canned tuna|tuna can",[116,25.5,0,0.8,0,10,1.3,237,247,27,0],{can:140},[100,"g"]);
F("prawns","Prawns / shrimp (cooked)","prawns|shrimp|prawn",[99,24,0.2,0.3,0,70,0.5,260,110,35,0],{piece:15},[100,"g"]);
F("whey","Whey protein powder","whey|whey protein|protein powder|protein shake|protein scoop|scoop whey",[400,80,8,6,0.5,400,1,600,300,100,0],{scoop:30,tbsp:10},[1,"scoop"]);
F("soyachunks","Soya chunks (dry)","soya chunks|soy chunks|nutrela|soya chunk|meal maker",[345,52,33,0.5,13,350,20,1800,20,250,0],{handful:30,bowl:50,cup:60},[50,"g"]);

/* ---- Grains, bread, cereals ---- */
F("oats","Oats (dry)","oats|rolled oats|oatmeal dry|quick oats",[389,16.9,66,6.9,10.6,54,4.7,429,2,177,0],{tbsp:7,cup:80,bowl:40,katori:40},[40,"g"]);
F("porridge","Oats porridge (cooked with water)","porridge|cooked oats|oats porridge|oats bowl",[71,2.5,12,1.5,1.7,9,0.7,70,4,26,0],{bowl:250,cup:240},[1,"bowl"]);
F("bread","Bread (white)","bread|white bread|bread slice|toast|bread slices",[265,9,49,3.2,2.7,144,3.6,115,491,25,0],{slice:28},[2,"slice"]);
F("brownbread","Bread (brown / whole wheat)","brown bread|whole wheat bread|wheat bread|multigrain bread",[250,10,43,3.5,6,100,2.5,190,450,60,0],{slice:30},[2,"slice"]);
F("pasta","Pasta (cooked)","pasta|spaghetti|macaroni|penne",[158,5.8,31,0.9,1.8,7,1.3,44,1,18,0],{cup:140,bowl:200,plate:250},[1,"plate"]);
F("noodles","Noodles (cooked)","noodles|hakka noodles|maggi|instant noodles|chowmein|chow mein",[138,4.5,25,2.1,1.2,10,1.2,50,350,15,0],{cup:140,bowl:200,plate:250},[1,"plate"]);
F("cornflakes","Cornflakes","cornflakes|corn flakes|cereal",[357,7.5,84,0.4,3.3,3,8,100,700,15,0],{bowl:30,cup:30},[1,"bowl"]);

/* ---- Fruit ---- */
F("banana","Banana","banana|bananas|kela",[89,1.1,23,0.3,2.6,5,0.3,358,1,27,8.7],{piece:110},[1,"piece"]);
F("apple","Apple","apple|apples|seb",[52,0.3,14,0.2,2.4,6,0.1,107,1,5,4.6],{piece:180},[1,"piece"]);
F("orange","Orange","orange|oranges|santra|mosambi|sweet lime",[47,0.9,12,0.1,2.4,40,0.1,181,0,10,53],{piece:130},[1,"piece"]);
F("mango","Mango","mango|mangoes|aam",[60,0.8,15,0.4,1.6,11,0.2,168,1,10,36],{piece:200,cup:165,bowl:150},[1,"bowl"]);
F("papaya","Papaya","papaya|papita",[43,0.5,11,0.3,1.7,20,0.3,182,8,21,60],{bowl:150,cup:145},[1,"bowl"]);
F("watermelon","Watermelon","watermelon|tarbooz",[30,0.6,7.6,0.2,0.4,7,0.2,112,1,10,8],{bowl:150,cup:150,slice:200},[1,"bowl"]);
F("grapes","Grapes","grapes|angoor",[69,0.7,18,0.2,0.9,10,0.4,191,2,7,3],{bowl:100,cup:150,handful:60},[1,"bowl"]);
F("guava","Guava","guava|amrud",[68,2.6,14,1,5.4,18,0.3,417,2,22,228],{piece:100},[1,"piece"]);
F("pomegranate","Pomegranate","pomegranate|anar",[83,1.7,19,1.2,4,10,0.3,236,3,12,10],{bowl:100,cup:175},[1,"bowl"]);
F("dates","Dates (khajoor)","dates|date|khajoor|khajur",[277,1.8,75,0.2,6.7,64,0.9,696,1,54,0],{piece:10},[3,"piece"]);
F("raisins","Raisins (kishmish)","raisins|kishmish|dried grapes",[299,3.1,79,0.5,3.7,50,1.9,749,11,32,2],{handful:30,tbsp:10},[1,"handful"]);

/* ---- Nuts, seeds ---- */
F("peanuts","Peanuts (roasted)","peanuts|peanut|moongphali|groundnut|groundnuts",[585,24,21,49,8,60,2.3,700,6,170,0],{handful:30,tbsp:10},[1,"handful"]);
F("almonds","Almonds","almonds|almond|badam",[579,21,22,50,12.5,269,3.7,733,1,270,0],{piece:1.2,handful:28},[10,"piece"]);
F("cashews","Cashews","cashews|cashew|kaju",[553,18,30,44,3.3,37,6.7,660,12,292,0],{piece:1.5,handful:28},[1,"handful"]);
F("walnuts","Walnuts","walnuts|walnut|akhrot",[654,15,14,65,6.7,98,2.9,441,2,158,1],{piece:4,handful:28},[1,"handful"]);
F("peanutbutter","Peanut butter","peanut butter|pb",[588,25,20,50,6,49,1.9,649,400,168,0],{tbsp:16,tsp:5},[2,"tbsp"]);
F("chia","Chia seeds","chia|chia seeds",[486,17,42,31,34,631,7.7,407,16,335,2],{tbsp:12,tsp:4},[1,"tbsp"]);
F("flax","Flax seeds","flax|flax seeds|flaxseed|flaxseeds|alsi",[534,18,29,42,27,255,5.7,813,30,392,0],{tbsp:10,tsp:3},[1,"tbsp"]);
F("pumpkinseeds","Pumpkin seeds","pumpkin seeds|pumpkin seed",[559,30,11,49,6,46,8.8,809,7,592,2],{tbsp:9,handful:28},[1,"tbsp"]);
F("makhana","Makhana (fox nuts, roasted)","makhana|fox nuts|lotus seeds|phool makhana",[347,9.7,77,0.1,14,60,1.4,500,1,67,0],{handful:20,bowl:30,cup:30},[1,"handful"]);

/* ---- Vegetables ---- */
F("potato","Potato (boiled)","potato|potatoes|aloo|boiled potato",[87,1.9,20,0.1,1.8,5,0.3,379,5,22,13],{piece:150},[1,"piece"]);
F("sweetpotato","Sweet potato (boiled)","sweet potato|shakarkandi|sweet potatoes",[76,1.4,17.7,0.1,2.5,27,0.7,230,27,18,13],{piece:150},[1,"piece"]);
F("spinach","Spinach (cooked)","spinach|palak|cooked spinach",[23,3,3.8,0.3,2.4,136,3.6,466,70,87,10],{bowl:100,cup:180},[1,"bowl"]);
F("mixveg","Mixed vegetables (boiled / steamed)","mixed vegetables|mixed veg|boiled vegetables|steamed vegetables|veggies|vegetables",[45,2.5,8,0.4,3,35,0.9,250,40,20,20],{bowl:150,cup:150,plate:200},[1,"bowl"]);
F("broccoli","Broccoli (steamed)","broccoli",[35,2.4,7.2,0.4,3.3,40,0.7,293,41,21,65],{bowl:100,cup:90},[1,"bowl"]);
F("cucumber","Cucumber","cucumber|kheera|kakdi",[15,0.7,3.6,0.1,0.5,16,0.3,147,2,13,3],{piece:200,slice:7,bowl:100},[1,"bowl"]);
F("tomato","Tomato","tomato|tomatoes|tamatar",[18,0.9,3.9,0.2,1.2,10,0.3,237,5,11,14],{piece:120},[1,"piece"]);
F("onion","Onion","onion|onions|pyaaz|pyaz",[40,1.1,9.3,0.1,1.7,23,0.2,146,4,10,7],{piece:100},[1,"piece"]);
F("carrot","Carrot","carrot|carrots|gajar",[41,0.9,9.6,0.2,2.8,33,0.3,320,69,12,6],{piece:70,bowl:100},[1,"piece"]);
F("peas","Green peas (boiled)","peas|green peas|matar",[84,5.4,15.6,0.2,5.5,27,1.5,271,3,39,14],{bowl:100,katori:80,cup:160},[1,"katori"]);
F("sprouts","Moong sprouts","sprouts|moong sprouts|sprouted moong|mixed sprouts",[30,3,5.9,0.2,1.8,13,0.9,149,6,21,13],{bowl:100,katori:80,cup:100},[1,"bowl"]);
F("salad","Salad (mixed raw veg)","salad|green salad|kachumber",[20,1,4,0.2,1.3,20,0.4,180,10,12,10],{bowl:100,plate:150},[1,"bowl"]);

/* ---- Fats, sweeteners ---- */
F("oil","Cooking oil","oil|cooking oil|sunflower oil|mustard oil|olive oil|vegetable oil",[884,0,0,100,0,0,0,0,0,0,0],{tsp:4.6,tbsp:14},[1,"tsp"]);
F("ghee","Ghee","ghee|clarified butter",[900,0,0,100,0,4,0,5,0,0,0],{tsp:5,tbsp:14},[1,"tsp"]);
F("butter","Butter","butter|makhan",[717,0.9,0.1,81,0,24,0,24,11,2,0],{tsp:5,tbsp:14,piece:10},[1,"tsp"]);
F("sugar","Sugar","sugar|cheeni|shakkar",[387,0,100,0,0,1,0,2,1,0,0],{tsp:4,tbsp:12},[1,"tsp"]);
F("honey","Honey","honey|shahad",[304,0.3,82,0,0.2,6,0.4,52,4,2,0.5],{tsp:7,tbsp:21},[1,"tsp"]);
F("jaggery","Jaggery (gud)","jaggery|gud|gur",[383,0.4,98,0.1,0,80,2.8,450,30,70,0],{piece:20,tsp:5,tbsp:15},[1,"piece"]);

/* ---- Drinks ---- */
F("chai","Chai / milk coffee (with sugar)","chai|tea|milk tea|coffee|milk coffee|masala chai|cutting chai",[50,1.4,7,1.5,0,50,0.1,70,20,6,0],{cup:150,glass:200},[1,"cup"]);
F("coconutwater","Coconut water","coconut water|nariyal pani|tender coconut water",[19,0.7,3.7,0.2,1.1,24,0.3,250,105,25,2.4],{glass:250,cup:240},[1,"glass"]);
F("juice","Fruit juice (orange)","juice|orange juice|fruit juice|packaged juice",[45,0.7,10.4,0.2,0.2,11,0.2,200,1,11,50],{glass:250,cup:240},[1,"glass"]);
F("cola","Cola / soft drink","cola|coke|pepsi|soft drink|soda|thums up|sprite",[42,0,10.6,0,0,2,0,2,4,0,0],{glass:250,can:330,cup:240},[1,"can"]);
F("soymilk","Soy milk (unsweetened)","soy milk|soya milk",[33,2.9,1.7,1.8,0.4,25,0.4,118,12,15,0],{glass:250,cup:240},[1,"glass"]);

/* ---- Snacks, sweets, treats ---- */
F("chips","Potato chips","chips|potato chips|wafers|lays",[536,7,53,35,4,24,1.3,1275,525,70,10],{handful:28,piece:2},[1,"handful"]);
F("biscuit","Biscuit (Marie / tea)","biscuit|biscuits|marie biscuit|parle g|cookies|cookie",[430,7,76,11,2,30,2,120,400,20,0],{piece:7},[4,"piece"]);
F("pizza","Pizza (cheese)","pizza|pizza slice",[266,11,33,10,2.3,200,2.5,172,598,23,1],{slice:107},[1,"slice"]);
F("darkchoc","Dark chocolate","dark chocolate|chocolate|choco",[546,5,61,31,7,73,8,559,20,146,0],{piece:10},[2,"piece"]);
F("icecream","Ice cream (vanilla)","ice cream|icecream|kulfi",[207,3.5,24,11,0.7,128,0.1,199,80,14,0.6],{scoop:66,bowl:100,cup:132},[1,"scoop"]);
F("gulabjamun","Gulab jamun","gulab jamun|gulabjamun",[330,5,52,12,0.5,80,0.8,150,60,15,0],{piece:40},[1,"piece"]);
F("kheer","Kheer (rice pudding)","kheer|payasam|rice pudding",[125,3.3,20,3.8,0.2,95,0.2,130,35,10,0],{bowl:150,katori:100},[1,"bowl"]);

/* ------------------------------------------------------------------------------------------------ */
const GENERIC_UNITS={g:1,gram:1,ml:1,tbsp:15,tsp:5,cup:240,glass:250,bowl:200,katori:150,plate:250,handful:30,slice:30,scoop:30,can:330,serving:100,piece:100};
const SIZE_MULT={small:0.75,medium:1,large:1.4};
const UNIT_ALIASES={
 kg:"kg",kilogram:"kg",kilograms:"kg",kgs:"kg",
 g:"g",gm:"g",gms:"g",gram:"g",grams:"g",gr:"g",
 ml:"ml",millilitre:"ml",milliliter:"ml",millilitres:"ml",milliliters:"ml",
 l:"l",litre:"l",liter:"l",litres:"l",liters:"l",
 cup:"cup",cups:"cup",bowl:"bowl",bowls:"bowl",katori:"katori",katoris:"katori",
 glass:"glass",glasses:"glass",tbsp:"tbsp",tablespoon:"tbsp",tablespoons:"tbsp",tbs:"tbsp",
 tsp:"tsp",teaspoon:"tsp",teaspoons:"tsp",piece:"piece",pieces:"piece",pc:"piece",pcs:"piece",
 slice:"slice",slices:"slice",scoop:"scoop",scoops:"scoop",plate:"plate",plates:"plate",
 handful:"handful",handfuls:"handful",can:"can",cans:"can",serving:"serving",servings:"serving",
 cube:"cube",cubes:"cube"
};
const NUM_WORDS={a:1,an:1,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,half:0.5,quarter:0.25,dozen:12,couple:2,single:1};
const DEFAULT_UNIT_LABELS={g:"g",ml:"ml",piece:"piece",slice:"slice",bowl:"bowl",katori:"katori (small bowl)",cup:"cup",glass:"glass",tbsp:"tbsp",tsp:"tsp",scoop:"scoop",plate:"plate",handful:"handful",can:"can",cube:"cube"};

/* ---------- helpers ---------- */
function norm(s){return String(s||"").toLowerCase().replace(/[^a-z0-9\s\/.]/g," ").replace(/\.(?!\d)/g," ").replace(/\s+/g," ").trim()}
function singular(w){if(w.length>4&&w.endsWith("ies"))return w.slice(0,-3)+"y";if(w.length>4&&w.endsWith("oes"))return w.slice(0,-2);if(w.length>3&&w.endsWith("s")&&!w.endsWith("ss"))return w.slice(0,-1);return w}
function stem(s){return norm(s).split(" ").filter(Boolean).map(singular).join(" ")}
const FOOD_BY_ID={};FOODS.forEach(f=>FOOD_BY_ID[f.id]=f);

/* alias index (stemmed) */
const INDEX=[];
FOODS.forEach(f=>{const names=[f.name.replace(/\(.*?\)/g," "),...f.al];names.forEach(n=>{const s=stem(n);if(s)INDEX.push({id:f.id,s,tokens:s.split(" ")})})});

function matchFood(text){
 const q=stem(text);if(!q)return null;
 const qt=q.split(" ");let best=null;
 for(const e of INDEX){
  let score=0;
  if(e.s===q)score=100;
  else if((" "+q+" ").includes(" "+e.s+" "))score=60+e.s.length;           /* alias appears as whole phrase inside the text */
  else if((" "+e.s+" ").includes(" "+q+" ")&&q.length>=3)score=40+q.length*0.5; /* text is a whole phrase inside alias */
  else{const hit=e.tokens.filter(t=>qt.includes(t)).length;if(hit&&hit===e.tokens.length)score=50+hit;else if(hit&&e.tokens.length>1&&hit/e.tokens.length>=0.6)score=30+hit}
  if(score&&(!best||score>best.score))best={id:e.id,score}
 }
 return best&&best.score>=40?FOOD_BY_ID[best.id]:null;
}
function searchFoods(text,limit=8){
 const q=stem(text);if(!q)return [];
 const out=[];
 FOODS.forEach(f=>{
  const hay=[f.name,...f.al].map(stem);let s=0;
  hay.forEach(h=>{if(h===q)s=Math.max(s,100);else if(h.startsWith(q))s=Math.max(s,80);else if((" "+h).includes(" "+q))s=Math.max(s,60);else if(h.includes(q))s=Math.max(s,40)});
  if(s)out.push([s,f]);
 });
 return out.sort((a,b)=>b[0]-a[0]).slice(0,limit).map(x=>x[1]);
}

function parseFraction(s){
 s=s.trim();let m;
 if((m=s.match(/^(\d+)\s+(\d+)\/(\d+)$/)))return +m[1]+ +m[2]/+m[3];
 if((m=s.match(/^(\d+)\/(\d+)$/)))return +m[1]/+m[2];
 const v=parseFloat(s);return isNaN(v)?null:v;
}
function unitGrams(food,unit){
 if(unit==="kg")return 1000;if(unit==="l")return 1000;
 if(food&&food.u&&food.u[unit]!=null)return food.u[unit];
 return GENERIC_UNITS[unit]!=null?GENERIC_UNITS[unit]:100;
}
function unitKnown(food,unit){
 if(unit==="g"||unit==="ml"||unit==="kg"||unit==="l")return true;
 return !!(food&&food.u&&food.u[unit]!=null);
}
function availableUnits(food){
 const base=["g","ml"];const extra=food?Object.keys(food.u):["piece","bowl","katori","cup","glass","tbsp","tsp","scoop","plate","slice","handful"];
 return base.concat(extra.filter(u=>!base.includes(u)));
}

/* Split a free-text description into item segments */
function splitMeal(text){
 return String(text||"").replace(/\r/g,"\n")
  .split(/[,;\n+&]|\band\b|\bplus\b|\balong with\b|\bwith\b|\bwith a side of\b/i)
  .map(s=>s.trim()).filter(Boolean);
}

/* Parse one segment such as "2 medium rotis", "paneer 100g", "one bowl dal", "200 ml milk" */
function parseSegment(raw){
 let s=" "+norm(raw).replace(/\bmilli?litres?\b/g,"ml")+" ";
 let qty=null,unit=null,size=null,approx=false;
 s=s.replace(/\b(about|around|approx|approximately|roughly|almost|nearly)\b/g," ").replace(/\s~\s/g," ");
 const sizeM=s.match(/\b(small|medium|large|big|regular)\b/);
 if(sizeM){size=sizeM[1]==="big"?"large":sizeM[1]==="regular"?"medium":sizeM[1];s=s.replace(sizeM[0]," ")}
 const unitRe="(kg|kilograms?|kgs|grams?|gms?|gr|g|ml|millilit(?:re|er)s?|l|litres?|liters?|cups?|bowls?|katoris?|glass(?:es)?|tbsp|tbs|tablespoons?|tsp|teaspoons?|pieces?|pcs?|slices?|scoops?|plates?|handfuls?|cans?|servings?|cubes?)";
 const numRe="(\\d+\\s+\\d+\\/\\d+|\\d+\\/\\d+|\\d*\\.?\\d+|a|an|one|two|three|four|five|six|seven|eight|nine|ten|half|quarter|dozen|couple|single)";
 /* number + unit, e.g. "100 g", "one bowl", "half cup", "2 slices of" */
 let m=s.match(new RegExp("(?:^|\\s)"+numRe+"\\s*"+unitRe+"(?=\\s|$)(?:\\s+of)?"));
 if(m&&(/^(a|an)$/.test(m[1])&&!/^(cup|bowl|katori|glass|tbsp|tsp|slice|scoop|plate|handful|can|piece|cube)/.test(m[2])))m=null;
 if(m){
  const n=NUM_WORDS[m[1]]!=null?NUM_WORDS[m[1]]:parseFraction(m[1]);
  qty=n;unit=UNIT_ALIASES[m[2].replace(/es$/,"").replace(/s$/,"")]||UNIT_ALIASES[m[2]]||UNIT_ALIASES[m[2].replace(/s$/,"")];
  if(!unit)unit=UNIT_ALIASES[m[2]];
  s=s.replace(m[0]," ");
 }else{
  /* bare unit without number: "bowl of dal", "glass milk" */
  const bu=s.match(new RegExp("(?:^|\\s)"+unitRe+"\\s+of(?=\\s)"))||s.match(/(?:^|\s)(bowl|katori|glass|cup|plate|handful|scoop)\s/);
  /* leading/trailing number meaning a count, e.g. "2 rotis", "3 eggs", "banana 2" */
  const cm=s.match(new RegExp("^\\s*"+numRe+"\\s+(?=[a-z])"))||s.match(new RegExp("\\s"+numRe+"\\s*$"));
  if(cm&&!(/^(a|an)$/.test(cm[1])&&false)){
   const n=NUM_WORDS[cm[1]]!=null?NUM_WORDS[cm[1]]:parseFraction(cm[1]);
   if(n!=null){qty=n;unit=null;s=s.replace(cm[0]," ")}
  }
  if(bu){const u=UNIT_ALIASES[bu[1]]||UNIT_ALIASES[bu[1].replace(/s$/,"")];if(u){unit=u;if(qty==null)qty=1;s=s.replace(bu[0]," ")}}
 }
 const name=s.replace(/\b(of|the|some|my|few|little|fresh|cooked|boiled|plain|home\s?made|homemade)\b/g," ").replace(/\s+/g," ").trim();
 return {raw:raw.trim(),name,qty,unit,size};
}

/* Build a ready-to-edit item from a parsed segment */
function buildItem(seg){
 const food=matchFood(seg.name)||matchFood(seg.raw);
 let qty=seg.qty,unit=seg.unit,flag="";
 if(food){
  if(qty==null){qty=food.d[0];unit=food.d[1];flag="default"}   /* no quantity mentioned -> typical serving */
  else if(!unit){ /* a bare count */
   unit=food.u.piece!=null?"piece":(food.d[1]!=="g"?food.d[1]:"g");
   if(unit==="g"&&qty<10){unit="piece"} /* e.g. "2 apples" with no piece weight */
  }
  if(!unitKnown(food,unit)){flag="unit"}
 }else{
  if(qty==null){qty=1;unit="serving"}
  if(!unit)unit="piece";
 }
 const mult=SIZE_MULT[seg.size||"medium"]||1;
 return {
  name:food?food.name:(seg.name||seg.raw),fid:food?food.id:null,matched:!!food,
  qty:Math.round(qty*100)/100,unit,size:seg.size||"medium",mult,flag,src:food?"db":"manual",
  per100:food?Object.fromEntries(NKEYS.map((k,i)=>[k,food.v[i]])):null,
  fixed:null, raw:seg.raw
 };
}
function parseMeal(text){return splitMeal(text).map(parseSegment).filter(s=>s.name||s.qty!=null).map(buildItem)}

function itemGrams(it){
 const food=it.fid?FOOD_BY_ID[it.fid]:null;
 const base=it.unit==="g"||it.unit==="ml"?1:unitGrams(food,it.unit);
 const mult=(it.unit==="g"||it.unit==="ml"||it.unit==="kg"||it.unit==="l")?1:(SIZE_MULT[it.size||"medium"]||1);
 return (Number(it.qty)||0)*base*mult;
}
/* Nutrients of an item (object keyed by NKEYS) */
function itemNutrients(it){
 const out={};
 if(it.fixed){NKEYS.forEach(k=>out[k]=Number(it.fixed[k])||0);return out}
 const g=itemGrams(it);
 NKEYS.forEach(k=>out[k]=it.per100?(Number(it.per100[k])||0)*g/100:0);
 return out;
}
function roundNut(o){const r={};NKEYS.forEach(k=>{const v=Number(o[k])||0;r[k]=k==="calories"?Math.round(v):Math.round(v*10)/10});return r}

const api={NUTS,NKEYS,FOODS,FOOD_BY_ID,SIZE_MULT,DEFAULT_UNIT_LABELS,matchFood,searchFoods,parseMeal,parseSegment,splitMeal,buildItem,itemGrams,itemNutrients,roundNut,availableUnits,unitGrams,unitKnown};
if(typeof module!=="undefined"&&module.exports)module.exports=api;else root.FoodDB=api;
})(typeof window!=="undefined"?window:globalThis);

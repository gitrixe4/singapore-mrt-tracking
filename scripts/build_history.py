"""Build curated station history data (opening year + name origin).

Opening years follow the documented line-opening stages. For stations
served by several lines, the year is the station's FIRST opening. Name
origins are concise curated summaries of commonly documented etymologies;
stations without a well-established origin story carry only their year.

Output: src/data/singapore/history.json
  { stationId: { "opened": 1987, "origin": "..." } }
"""

import json
import os

BASE = os.path.join(os.path.dirname(__file__), "..", "src", "data", "singapore")

OPENED = {
    1987: ["yio-chu-kang", "ang-mo-kio", "bishan", "braddell", "toa-payoh",
           "novena", "newton", "orchard", "somerset", "dhoby-ghaut",
           "city-hall", "raffles-place", "tanjong-pagar", "outram-park"],
    1988: ["tiong-bahru", "redhill", "queenstown", "commonwealth",
           "buona-vista", "clementi", "jurong-east", "chinese-garden",
           "lakeside", "yishun", "khatib"],
    1989: ["bugis", "lavender", "kallang", "aljunied", "paya-lebar", "eunos",
           "kembangan", "bedok", "tanah-merah", "marina-bay", "simei",
           "tampines", "pasir-ris"],
    1990: ["choa-chu-kang", "bukit-batok", "bukit-gombak", "boon-lay"],
    1996: ["yew-tee", "kranji", "marsiling", "woodlands", "admiralty",
           "sembawang"],
    1999: ["south-view", "keat-hong", "teck-whye", "phoenix", "bukit-panjang",
           "petir", "pending", "bangkit", "fajar", "segar", "jelapang",
           "senja"],
    2001: ["dover", "expo"],
    2002: ["changi-airport"],
    2003: ["harbourfront", "chinatown", "clarke-quay", "little-india",
           "farrer-park", "boon-keng", "potong-pasir", "serangoon", "kovan",
           "hougang", "sengkang", "punggol", "compassvale", "rumbia", "bakau",
           "kangkar", "ranggung"],
    2005: ["thanggam", "fernvale", "layar", "tongkang", "renjong", "cove",
           "meridian", "coral-edge", "riviera", "kadaloor"],
    2006: ["buangkok"],
    2007: ["farmway", "oasis"],
    2009: ["bartley", "lorong-chuan", "marymount", "pioneer", "joo-koon"],
    2010: ["bras-basah", "esplanade", "promenade", "nicoll-highway",
           "stadium", "mountbatten", "dakota", "macpherson", "tai-seng"],
    2011: ["caldecott", "botanic-gardens", "farrer-road", "holland-village",
           "one-north", "kent-ridge", "haw-par-villa", "pasir-panjang",
           "labrador-park", "telok-blangah", "woodleigh", "damai"],
    2012: ["bayfront"],
    2013: ["downtown", "telok-ayer", "cheng-lim"],
    2014: ["marina-south-pier", "sam-kee", "punggol-point", "samudera",
           "nibong", "sumang", "soo-teck"],
    2015: ["cashew", "hillview", "beauty-world", "king-albert-park",
           "sixth-avenue", "tan-kah-kee", "stevens", "rochor", "kupang"],
    2017: ["fort-canning", "bencoolen", "jalan-besar", "bendemeer",
           "geylang-bahru", "mattar", "ubi", "kaki-bukit", "bedok-north",
           "bedok-reservoir", "tampines-west", "tampines-east",
           "upper-changi", "gul-circle", "tuas-crescent", "tuas-west-road",
           "tuas-link"],
    2019: ["canberra"],
    2020: ["woodlands-north", "woodlands-south"],
    2021: ["springleaf", "lentor", "mayflower", "bright-hill",
           "upper-thomson"],
    2022: ["napier", "orchard-boulevard", "great-world", "havelock",
           "maxwell", "shenton-way", "gardens-by-the-bay"],
    2024: ["tanjong-rhu", "katong-park", "tanjong-katong", "marine-parade",
           "marine-terrace", "siglap", "bayshore", "punggol-coast",
           "teck-lee"],
    2025: ["hume"],
    2026: ["keppel", "cantonment", "prince-edward-road"],
}

ORIGIN = {
    # North South Line corridor
    "yio-chu-kang": "A 'chu kang' was a river plantation district run by a clan headman — this one belonged to the Yio (Yeo) clan, who grew gambier and pepper here.",
    "ang-mo-kio": "Hokkien for 'red-haired man's bridge' — after a bridge associated with the British ('ang mo', red-haired people); a rival theory reads it as the tomato, the 'red-haired person's brinjal'.",
    "bishan": "From Peck San Theng (碧山亭, 'jade hill pavilion'), the vast Cantonese cemetery that occupied the area before the new town was built over it in the 1980s.",
    "braddell": "After Sir Thomas Braddell, the first Attorney-General of the Straits Settlements.",
    "toa-payoh": "Hokkien for 'big swamp' — the new town rose from what was once marshland and squatter farms.",
    "novena": "After the Church of St Alphonsus nearby, universally known as Novena Church for its popular weekly novena devotions.",
    "newton": "After Newton Road and Newton Circus, commemorating a 19th-century municipal engineer named Newton.",
    "orchard": "After Orchard Road, which in the 1830s ran between nutmeg orchards and pepper plantations.",
    "somerset": "After Somerset Road, named for the English county.",
    "dhoby-ghaut": "From Hindi 'dhobi' (washerman) and 'ghat' (river steps) — Indian dhobies once washed and dried laundry along the Stamford Canal here.",
    "city-hall": "After the adjacent City Hall (1929), where the Japanese surrender was signed in 1945 and Singapore's self-governance was proclaimed in 1959.",
    "raffles-place": "Laid out as Commercial Square in 1824 and renamed in 1858 for Sir Stamford Raffles, founder of colonial Singapore.",
    "marina-bay": "Descriptive name for the bay created by reclaiming Marina South and Marina East from the sea.",
    "marina-south-pier": "Serves the pier from which ferries leave for the Southern Islands.",
    "yishun": "The Mandarin form of Nee Soon — after Lim Nee Soon (1879–1936), the 'Pineapple King' whose rubber and pineapple estates covered the area.",
    "khatib": "From nearby Sungei Khatib Bongsu, recalling a khatib (mosque preacher) who once owned land by the river.",
    "canberra": "After Canberra Road in the former British naval base, named for Australia's capital city.",
    "sembawang": "After the sembawang tree (Mesua ferruginea), which grew along the Sembawang River; a specimen is planted at Sembawang Park.",
    "admiralty": "After the British Admiralty, whose great Sembawang Naval Base dominated this coast from the 1920s to 1971.",
    "woodlands": "The wooded coast seen from across the Johor Strait; early travellers described the shoreline plantations as 'the woodlands'.",
    "marsiling": "From Ma Xi Ling (马西岭), the hill-village name carried here by early Chinese settlers.",
    "kranji": "After the kranji tree (Dialium indum), a hardwood once common along Sungei Kranji.",
    "yew-tee": "Teochew for 'oil pond' (油池) — the Japanese stored oil in the area during the WWII occupation.",
    "choa-chu-kang": "A 'chu kang' was a river plantation district run by a clan headman ('kangchu') — this one of the Choa (Chua) clan.",
    "bukit-gombak": "Malay — 'bukit' (hill) with 'gombak' (tuft or topknot), for the twin granite hills that crown the area.",
    "bukit-batok": "Malay 'hill of coconut shells' ('batok') by most readings — folk legend prefers the 'coughing hill', echoing quarry blasts in its granite face.",
    "jurong-east": "Jurong is possibly from Malay 'jerung' (shark) or 'penjuru' (corner/cape); the fishing river became Singapore's great industrial estate from 1961.",
    "chinese-garden": "After the adjacent Chinese Garden (Yu Hwa Yuan), the Jurong Lake garden built in 1975 in northern Sung style.",
    "lakeside": "Descriptive — on the western shore of Jurong Lake.",
    "boon-lay": "After Chew Boon Lay (1852–1933), whose gambier, pepper and rubber estates covered the Jurong area.",

    # East West Line
    "pasir-ris": "Malay, usually read as 'pasir hiris' — shredded / narrow sand — after the long sandy beach on the north-east coast.",
    "tampines": "After the tempinis tree (Streblus elongatus), an ironwood that once forested the area — one of Singapore's oldest recorded placenames.",
    "simei": "Mandarin for 'four beauties' (四美) — the surrounding streets once bore the names of the four legendary beauties of Chinese history.",
    "tanah-merah": "Malay for 'red earth' — after the red laterite sea-cliffs that served as a landmark for sailors.",
    "bedok": "Among Singapore's oldest placenames (charted from 1604) — possibly from 'bedoh', the great mosque drum, or 'biduk', a Malay fishing boat.",
    "kembangan": "Malay for 'blossoming' or 'expansion'.",
    "eunos": "After Mohamed Eunos Abdullah (1876–1933), father of Malay journalism and founder of the Singapore Malay Union.",
    "paya-lebar": "Malay for 'wide swamp', after the marshland that covered the district.",
    "aljunied": "After Syed Omar bin Ali Aljunied, the Yemeni merchant-philanthropist who gave land for mosques, churches and hospitals in early Singapore.",
    "kallang": "After the Kallang River and the Orang Kallang, the sea people who lived at its mouth before 1819.",
    "lavender": "Named in irony — Lavender Street was infamous for the stench of its nightsoil-fertilised vegetable farms, so residents called it after the fragrant plant.",
    "bugis": "After the Bugis, the seafaring traders from Sulawesi whose schooners crowded the Rochor and Kallang river mouths in the 1820s.",
    "tanjong-pagar": "Malay for 'cape of stakes' — after the fenced kelong fishing traps that lined the old shoreline.",
    "outram-park": "After Sir James Outram (1803–1863), British general of the Indian Rebellion of 1857.",
    "tiong-bahru": "Hokkien 'tiong' (from 塚, burial ground) with Malay 'bahru' (new) — the 'new cemetery', in contrast to the old one at Chinatown.",
    "redhill": "English for Bukit Merah — the red laterite hill of the swordfish legend, in which a boy's clever plan to stop swordfish attacks ended with his blood staining the hill.",
    "queenstown": "Singapore's first satellite town, named in 1953 to mark the coronation of Queen Elizabeth II.",
    "commonwealth": "After Commonwealth Avenue, named for the Commonwealth of Nations as Singapore moved toward self-government.",
    "buona-vista": "Italian for 'good view' — the road was named around 1902 for its hilltop vista toward the sea.",
    "dover": "After Dover Road, one of a cluster of roads named after English towns.",
    "clementi": "After Sir Cecil Clementi, Governor of the Straits Settlements (1930–1934), whose grand-uncle Sir Cecil Clementi Smith had also governed.",
    "pioneer": "After Pioneer Road and Pioneer Sector, honouring the industrial pioneers of Jurong.",
    "joo-koon": "After Joo Koon Circle in the Jurong industrial estate.",
    "gul-circle": "After Gul Circle, from Tanjong Gul at the western tip of the mainland.",
    "tuas-crescent": "Tuas recalls 'menuas', a Malay fishing technique that lured fish under floating coconut fronds.",
    "tuas-west-road": "Tuas recalls 'menuas', a Malay fishing technique that lured fish under floating coconut fronds.",
    "tuas-link": "Tuas recalls 'menuas', a Malay fishing technique that lured fish under floating coconut fronds.",
    "expo": "Serves the Singapore Expo exhibition centre, opened in 1999.",
    "changi-airport": "Changi is possibly named for the chengai tree; the airport opened on the reclaimed eastern coast in 1981.",
    "upper-changi": "Changi is possibly named for the chengai tree; the station serves the SUTD campus.",

    # North East Line
    "harbourfront": "Descriptive — at Keppel Harbour, on the site of the former World Trade Centre; gateway to Sentosa.",
    "chinatown": "The heart of the historic Chinese quarter Raffles allotted in 1822 — known in Cantonese as Kreta Ayer, 'bullock-cart water'.",
    "clarke-quay": "After Sir Andrew Clarke, second Governor of the Straits Settlements, who made the Singapore River quays the colony's trading artery.",
    "little-india": "The historic Indian quarter that grew along Serangoon Road's cattle yards and spice gardens.",
    "farrer-park": "After Roland John Farrer, long-serving president of the Municipal Commissioners; the park hosted Singapore's first aeroplane landing in 1911.",
    "boon-keng": "After Dr Lim Boon Keng (1869–1957), physician, reformer and philanthropist of the Straits Chinese community.",
    "potong-pasir": "Malay for 'cut sand' — the district was pocked with sand-quarrying pits before it became a vegetable-farming village.",
    "woodleigh": "After Woodleigh Close, which took its name from a colonial-era estate house.",
    "serangoon": "Often traced to the ranggung, a marsh bird of the Serangoon River — or to 'di-serang dengan gong', 'attacked with gongs' to scare wild animals.",
    "kovan": "After Kovan Road in the old Hougang countryside.",
    "hougang": "Teochew for 'river's end' (后港) — the upper reaches of the Serangoon River, heart of Teochew rural Singapore.",
    "buangkok": "From 万国 ('myriad nations'), the name of the former Bankok/Buangkok rubber estate.",
    "sengkang": "Chinese 盛港, 'prosperous harbour' — recalling the fishing jetties of the Serangoon River.",
    "punggol": "Old Malay kampong name — 'ponggol' describes hurling a stick to knock fruit from a tree, and a riverside fruit wholesaling point.",
    "punggol-coast": "Descriptive — serves the new Punggol Digital District by the northern coast.",

    # Circle Line
    "bras-basah": "Malay 'beras basah', 'wet rice' — cargoes of rice soaked by the sea were dried on the banks of the stream here.",
    "esplanade": "After the Esplanade waterfront and theatres — the old sea-front promenade of colonial Singapore.",
    "promenade": "Descriptive — by the Marina Bay waterfront promenade.",
    "nicoll-highway": "After Sir John Nicoll, Governor of Singapore (1952–1955).",
    "stadium": "Serves the National Stadium at Kallang, successor to the 1973 Grand Old Dame.",
    "mountbatten": "After Lord Louis Mountbatten, Supreme Allied Commander in South East Asia, who accepted the Japanese surrender in Singapore in 1945.",
    "dakota": "After the Douglas 'Dakota' DC-3 aircraft that flew from old Kallang Airport — remembered also in Dakota Crescent.",
    "macpherson": "After Lt-Col Ronald MacPherson, first Colonial Secretary of the Straits Settlements, designer of St Andrew's Cathedral.",
    "tai-seng": "After the Tai Seng (大成) estate name of the surrounding industrial district.",
    "bartley": "After Bartley Road, named for William Bartley, a member of the Municipal Commission.",
    "lorong-chuan": "Malay 'lorong' (lane) joined to the Chinese estate name Chuan.",
    "marymount": "After Marymount Convent and its school, established by the Good Shepherd sisters.",
    "caldecott": "After Sir Andrew Caldecott, colonial administrator; Caldecott Hill was the home of Singapore broadcasting from 1937.",
    "botanic-gardens": "After the Singapore Botanic Gardens (1859), the country's first UNESCO World Heritage Site.",
    "farrer-road": "After Roland John Farrer, president of the Municipal Commissioners in the early 20th century.",
    "holland-village": "After Hugh Holland, an early architect and amateur actor — not the Netherlands, despite the district's expatriate flavour.",
    "one-north": "Named for Singapore's latitude — one degree north of the equator — as the research district's forward-looking brand.",
    "kent-ridge": "Renamed from Pasir Panjang Ridge after the Duchess of Kent's 1952 visit; site of the fierce WWII Battle of Pasir Panjang.",
    "haw-par-villa": "After the Haw Par Villa gardens of Chinese mythology, built in 1937 by the Tiger Balm brothers Aw Boon Haw and Aw Boon Par.",
    "pasir-panjang": "Malay for 'long sand' — the long beach that ran along the coast before land reclamation.",
    "labrador-park": "After Labrador Park and its colonial coastal battery; the name descends from the 19th-century Labrador Villa estate.",
    "telok-blangah": "Malay 'telok' (bay) and 'belanga' (clay cooking pot) — the pot-shaped bay that was once the seat of the Temenggong of Johor.",
    "keppel": "After Admiral Henry Keppel, who charted the deep-water New Harbour; it was renamed Keppel Harbour in his honour in 1900.",
    "cantonment": "After Cantonment Road, where sepoy troops of the early colony were cantoned (garrisoned); the station sits by the old Tanjong Pagar railway station.",
    "prince-edward-road": "After Prince Edward, the Prince of Wales (later Edward VIII), following his visit to Singapore in 1922.",
    "bayfront": "Descriptive — serves Marina Bay Sands and Gardens by the Bay on the bay's waterfront.",

    # Downtown Line
    "bukit-panjang": "Malay for 'long hill', after the ridge that runs beside the town.",
    "cashew": "After Cashew Road and the cashew plantations that once grew on these slopes.",
    "hillview": "After Hillview Avenue, in the shadow of Bukit Timah hill.",
    "hume": "After Hume Avenue, named for Hume Industries, whose pipe factory stood here.",
    "beauty-world": "After the Beauty World amusement park and market (1947), once the biggest bazaar in the west of Singapore.",
    "king-albert-park": "After King Albert I of Belgium, honoured as a WWI ally.",
    "sixth-avenue": "After the Bukit Timah residential avenue of the same name.",
    "tan-kah-kee": "After Tan Kah Kee (1874–1961), rubber magnate and philanthropist who founded Hwa Chong Institution next door.",
    "stevens": "After Stevens Road.",
    "rochor": "After the Rochor River and canal, one of the two streams that framed the old town plan.",
    "downtown": "Descriptive — in the heart of the Marina Bay financial district.",
    "telok-ayer": "Malay for 'water bay' — the original shoreline where immigrants first landed; Thian Hock Keng temple on this street once faced the open sea.",
    "fort-canning": "After the hill fort named for Viceroy Charles Canning — known to the Malays as Bukit Larangan, the Forbidden Hill of the ancient kings.",
    "bencoolen": "After Bencoolen Street, recalling Bengkulu in Sumatra, Raffles' post before he founded Singapore.",
    "jalan-besar": "Malay for 'big road' — the avenue laid across a betel-nut plantation in the 1880s.",
    "bendemeer": "From Bendemeer House, the Whampoa estate renamed after the 'bowers of Bendemeer' in Thomas Moore's poem Lalla Rookh.",
    "geylang-bahru": "'New Geylang' — Geylang itself is often traced to Malay 'kilang', the mills that pressed coconut and lemongrass oil.",
    "mattar": "After Mattar Road.",
    "ubi": "Malay for 'tapioca' — the root crop widely planted here, especially during the war years.",
    "kaki-bukit": "Malay for 'foot of the hill'.",
    "bedok-north": "North of Bedok — one of Singapore's oldest placenames, possibly from the mosque drum 'bedoh'.",
    "bedok-reservoir": "By Bedok Reservoir, a former sand quarry turned water body.",
    "tampines-west": "West of Tampines, named for the tempinis ironwood tree.",
    "tampines-east": "East of Tampines, named for the tempinis ironwood tree.",

    # Thomson-East Coast Line
    "woodlands-north": "North of Woodlands, by the future Johor Bahru–Singapore RTS link terminus.",
    "woodlands-south": "South of Woodlands town centre.",
    "springleaf": "After the Springleaf estate off Upper Thomson Road.",
    "lentor": "After Lentor Avenue and the surrounding estate.",
    "mayflower": "After the Mayflower estate in Ang Mo Kio.",
    "bright-hill": "After Bright Hill Temple — Kong Meng San Phor Kark See, Singapore's largest Buddhist monastery.",
    "upper-thomson": "After John Turnbull Thomson, Government Surveyor of the Straits Settlements, who laid the road north.",
    "napier": "After Napier Road, named for William Napier, Singapore's first Law Agent.",
    "orchard-boulevard": "Descriptive — on the boulevard running parallel to Orchard Road.",
    "great-world": "After the Great World amusement park, one of the three famous 'Worlds' of mid-century Singapore nightlife.",
    "havelock": "After General Sir Henry Havelock, British commander of the Indian Rebellion of 1857.",
    "maxwell": "After Maxwell Road, home of the famous Maxwell Food Centre.",
    "shenton-way": "After Sir Shenton Thomas, last Governor of the Straits Settlements, who endured the Japanese occupation as a prisoner.",
    "gardens-by-the-bay": "Serves the Gardens by the Bay, opened on reclaimed land in 2012.",
    "tanjong-rhu": "Malay for 'cape of casuarina trees', after the rhu trees on the old shipyard point.",
    "katong-park": "Katong is popularly said to be an extinct species of sea turtle, or the shimmer of heat haze on the sea; the park sits on the old seafront.",
    "tanjong-katong": "The cape of Katong — the historic seaside district of Peranakan mansions.",
    "marine-parade": "After the seafront estate built entirely on reclaimed land in the 1970s.",
    "marine-terrace": "After the Marine Parade estate street of the same name.",
    "siglap": "Malay 'si-gelap', 'the dark one' — legend ties the name to a solar eclipse, or to the darkness of its dense coastal groves.",
    "bayshore": "After Bayshore Road along the East Coast.",

    # Bukit Panjang LRT
    "south-view": "Descriptive — looking south over Choa Chu Kang.",
    "keat-hong": "After the old Keat Hong village and camp.",
    "teck-whye": "After Teck Whye estate and road.",
    "phoenix": "After the Phoenix Heights estate.",
    "petir": "Malay for 'thunderbolt' — Bukit Panjang's LRT stops carry Malay nature names.",
    "pending": "Malay for an ornamental royal belt buckle.",
    "bangkit": "Malay for 'to rise'.",
    "fajar": "Malay for 'dawn'.",
    "segar": "Malay for 'fresh'.",
    "jelapang": "Malay for 'granary' or rice barn.",
    "senja": "Malay for 'dusk'.",

    # Sengkang LRT
    "compassvale": "After the Compassvale estate, whose name recalls the compass bearings of the old survey plans.",
    "rumbia": "Malay for the sago palm.",
    "bakau": "Malay for the mangrove tree that lines the nearby Sungei Punggol.",
    "kangkar": "Teochew 'foot of the port' (港脚) — the old Kangkar fishing village stood at the head of the Serangoon River.",
    "ranggung": "After Lorong Ranggung; the ranggung is a marsh bird associated with the Serangoon area.",
    "cheng-lim": "After Cheng Lim Farmway, recalling the poultry farms of old Sengkang.",
    "farmway": "After the numbered farmways of the former Punggol pig- and poultry-farming district.",
    "kupang": "Malay for the green mussel, harvested along the Punggol coast.",
    "thanggam": "Tamil for 'gold'.",
    "fernvale": "After Fernvale Lane and the old Fernvale estate.",
    "layar": "Malay for 'sail'.",
    "tongkang": "Malay for the wooden lighter boats that worked Singapore's rivers.",
    "renjong": "After Lorong Renjong, an old kampong track of the district.",

    # Punggol LRT
    "cove": "Part of the Punggol waterfront naming theme.",
    "meridian": "Part of the Punggol waterfront naming theme.",
    "coral-edge": "Part of the Punggol waterfront naming theme.",
    "riviera": "Part of the Punggol waterfront naming theme.",
    "kadaloor": "Tamil — 'kadal' (sea) with 'oor' (town): the seaside town.",
    "oasis": "Part of the Punggol waterfront naming theme.",
    "damai": "Malay for 'peace'.",
    "sam-kee": "After the old Sam Kee kampong jetty on the Punggol shore.",
    "punggol-point": "After Punggol Point, the northern tip where the old jetty and seafood restaurants stood.",
    "samudera": "Malay (from Sanskrit) for 'ocean'.",
    "nibong": "Malay for the nibong palm of the mangrove coast.",
    "sumang": "After Sumang Walk; part of Punggol's kampong-heritage street names.",
    "soo-teck": "After the old Soo Teck kampong of the Punggol district.",
    "teck-lee": "After the old Teck Lee kampong of the Punggol district.",
}

stations = json.load(open(os.path.join(BASE, "stations.json")))
ids = {s["id"] for s in stations}

history = {}
for year, sids in OPENED.items():
    for sid in sids:
        assert sid in ids, f"unknown station id: {sid}"
        assert sid not in history, f"duplicate year for: {sid}"
        history[sid] = {"opened": year}

missing_year = ids - set(history)
assert not missing_year, f"stations missing opening year: {sorted(missing_year)}"

for sid, origin in ORIGIN.items():
    assert sid in ids, f"unknown station id in ORIGIN: {sid}"
    history[sid]["origin"] = origin

no_origin = ids - set(ORIGIN)
if no_origin:
    print(f"note: {len(no_origin)} stations without origin text: {sorted(no_origin)}")

out = os.path.join(BASE, "history.json")
json.dump(history, open(out, "w"), indent=2, sort_keys=True)
print(f"wrote {out}: {len(history)} stations")

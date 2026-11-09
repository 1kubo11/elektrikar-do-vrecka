/**
 * Referenčné tabuľky a značenie.
 * NEOVERENÉ — všetko v tomto súbore je pomôcka na orientáciu.
 * Uťahovacie momenty majú VŽDY prednosť od výrobcu svorky alebo prístroja.
 */

export const REFERENCE_SOURCE = {
  verified: false,
  note:
    'Referenčné tabuľky sú orientačné. Farby, zóny, krytie a momenty si over v ' +
    'platnej norme a v dokumentácii výrobcu. Staré značenia uvádzam preto, že sa ' +
    'v starých inštaláciách reálne stretneš — nie ako predpis pre novú inštaláciu.',
};

export const WIRE_COLORS = {
  current: [
    { fn: 'L1', sk: 'fáza 1', de: 'Außenleiter L1', color: 'hnedá', hex: '#8a5a2b', note: 'V DE aj SK rovnako.' },
    { fn: 'L2', sk: 'fáza 2', de: 'Außenleiter L2', color: 'čierna', hex: '#1a1a1a', note: '' },
    { fn: 'L3', sk: 'fáza 3', de: 'Außenleiter L3', color: 'šedá', hex: '#9a9a9a', note: '' },
    { fn: 'N', sk: 'nulový vodič', de: 'Neutralleiter', color: 'modrá', hex: '#2f6fd0', note: 'Svetlomodrá. Nikdy nepoužívaj modrú na fázu.' },
    { fn: 'PE', sk: 'ochranný vodič', de: 'Schutzleiter', color: 'zeleno-žltá', hex: '#5aa02c', note: 'Výhradne pre PE. Nikdy na nič iné.' },
    { fn: 'PEN', sk: 'PEN vodič', de: 'PEN-Leiter', color: 'zeleno-žltá s modrým značením na koncoch', hex: '#5aa02c', note: 'Len v starých TN-C inštaláciách.' },
  ],
  oldDE: [
    { fn: 'PE (staré DE)', color: 'červená alebo šedá', note: 'Do roku 1965 bol PE červený, potom šedý. V starých domoch v Nemecku na to pozor.' },
    { fn: 'N (staré DE)', color: 'šedá', note: 'Pred rokom 1965 bol nulový vodič šedý, PE červený.' },
    { fn: 'L (staré DE)', color: 'čierna / hnedá / biela', note: 'Neexistovalo jednotné značenie fáz.' },
    { fn: 'Klasická inštalácia 1965–1990', color: 'PE zeleno-žltý, N šedý', note: 'N bol ešte šedý, nie modrý. Modrá prišla neskôr.' },
  ],
  oldSK: [
    { fn: 'PE/PEN (staré SK/ČSSR)', color: 'zeleno-žltá', note: 'Zeleno-žltá je stará aj nová.' },
    { fn: 'N (staré SK)', color: 'svetlomodrá', note: 'Modrá na nulový vodič je na SK dlhodobo zavedená.' },
    { fn: 'L (staré SK)', color: 'čierna, hnedá, (biela)', note: 'Fázy sa značili hlavne čiernou a hnedou.' },
    { fn: 'Pozor — dvojvodičové obvody', color: '—', note: 'V starých bytoch nájdeš obvody bez PE. Zásuvky s PE sa tam nedajú len tak pridať.' },
  ],
  warn:
    'NIKDY neurči funkciu vodiča len podľa farby v starej inštalácii. Vždy zmeraj. ' +
    'V starých domoch sa farby používali inak a často boli použité nesprávne.',
};

export const BREAKER_CHARS = [
  { id: 'B', sk: 'Istič char. B', de: 'Leitungsschutzschalter Typ B', trip: 'okamžité vypnutie pri 3–5×In', use: 'Zásuvky, svetlá, odporové záťaže. Najlepší pre dlhé trasy.', warn: 'Môže vypínať pri zapnutí veľkého množstva LED alebo trafa.' },
  { id: 'C', sk: 'Istič char. C', de: 'Leitungsschutzschalter Typ C', trip: 'okamžité vypnutie pri 5–10×In', use: 'Záťaže so spínacím prúdom — LED, zdroje, malé motory.', warn: 'Na dlhé trasy potrebuje dvakrát väčší skratový prúd ako B.' },
  { id: 'D', sk: 'Istič char. D', de: 'Leitungsschutzschalter Typ D', trip: 'okamžité vypnutie pri 10–20×In', use: 'Transformátory, veľké motory, zváračky.', warn: 'Najhorší pre odpojenie poruchy na dlhých trasách. Často potrebuje RCD.' },
  { id: 'gG', sk: 'Poistka gG', de: 'Schmelzsicherung gG (NH/Diazed)', trip: 'podľa krivky, I2 = 1,6×In', use: 'Prívody, predradené istenie, tam kde treba vysokú vypínaciu schopnosť.', warn: 'Kvôli I2 = 1,6×In nestačí In ≤ Iz — treba In ≤ 0,906×Iz.' },
  { id: 'motor', sk: 'Istič motora', de: 'Motorschutzschalter', trip: 'nastaviteľná tepelná + magnetická ochrana', use: 'Motory — chráni pred preťažením aj stratou fázy.', warn: 'Nastav na prúd zo ŠTÍTKU motora. Pásmo magnetického vypnutia si zisti v katalógu.' },
];

export const IP_CODE = {
  first: [
    { d: '0', sk: 'bez ochrany', de: 'kein Schutz' },
    { d: '1', sk: 'cudzie telesá nad 50 mm (ruka)', de: '> 50 mm' },
    { d: '2', sk: 'cudzie telesá nad 12,5 mm (prst)', de: '> 12,5 mm' },
    { d: '3', sk: 'cudzie telesá nad 2,5 mm (nástroj)', de: '> 2,5 mm' },
    { d: '4', sk: 'cudzie telesá nad 1 mm (drôt)', de: '> 1 mm' },
    { d: '5', sk: 'ochrana proti prachu (prach vnikne, ale neprekáža)', de: 'staubgeschützt' },
    { d: '6', sk: 'prachotesné', de: 'staubdicht' },
  ],
  second: [
    { d: '0', sk: 'bez ochrany', de: 'kein Schutz' },
    { d: '1', sk: 'kvapkajúca voda zvrchu', de: 'Tropfwasser' },
    { d: '2', sk: 'kvapkajúca voda do 15°', de: 'Tropfwasser 15°' },
    { d: '3', sk: 'striekajúca voda do 60° (dážď)', de: 'Sprühwasser' },
    { d: '4', sk: 'striekajúca voda zo všetkých strán', de: 'Spritzwasser' },
    { d: '5', sk: 'tryskajúca voda (prúd)', de: 'Strahlwasser' },
    { d: '6', sk: 'silne tryskajúca voda', de: 'starkes Strahlwasser' },
    { d: '7', sk: 'krátkodobé ponorenie', de: 'zeitweiliges Untertauchen' },
    { d: '8', sk: 'trvalé ponorenie', de: 'dauerndes Untertauchen' },
    { d: '9', sk: 'vysokotlakové čistenie (9K)', de: 'Hochdruckreinigung' },
  ],
  common: [
    { code: 'IP20', use: 'Suché vnútorné priestory — bežné zásuvky a vypínače.' },
    { code: 'IP44', use: 'Vlhké priestory, kúpeľňa zóna 2, vonku pod prístreškom.' },
    { code: 'IP54', use: 'Vonkajšie prostredie, stavenisko, prašné priestory.' },
    { code: 'IP65', use: 'Vonku bez ochrany, striekanie vodou, umývanie.' },
    { code: 'IP67', use: 'Dočasné zatopenie, podzemné boxy.' },
    { code: 'IP68', use: 'Trvalé ponorenie — konektory FV, zapustené svietidlá.' },
  ],
};

export const IK_CODE = [
  { code: 'IK00', j: 'bez ochrany', use: '—' },
  { code: 'IK01', j: '0,15 J', use: '—' },
  { code: 'IK05', j: '0,7 J', use: 'bežné vnútorné prístroje' },
  { code: 'IK07', j: '2 J', use: 'exponované vnútorné priestory' },
  { code: 'IK08', j: '5 J', use: 'wallboxy, vonkajšie rozvádzače' },
  { code: 'IK09', j: '10 J', use: 'priemysel, telocvične' },
  { code: 'IK10', j: '20 J', use: 'verejné priestory, vandalizmus' },
];

export const BATHROOM_ZONES = {
  warn:
    'ZÓNY A ICH PRAVIDLÁ SA MENILI A LÍŠIA SA MEDZI DE A SK. Toto je orientačný ' +
    'prehľad, nie predpis. Pred montážou si over platnú normu (DIN VDE 0100-701 / ' +
    'STN 33 2000-7-701) a vydanie, ktoré platí pre tvoju zákazku.',
  zones: [
    {
      id: '0', sk: 'Zóna 0 — vnútro vane alebo sprchy', de: 'Bereich 0',
      geometry: 'Vnútorný objem vane alebo sprchovacej vaničky.',
      allowed: 'Len zariadenia určené pre zónu 0, SELV max. 12 V AC / 30 V DC, zdroj mimo zón.',
      ip: 'IPX7',
    },
    {
      id: '1', sk: 'Zóna 1 — nad vaňou/sprchou', de: 'Bereich 1',
      geometry: 'Nad zónou 0 do výšky 2,25 m (pri sprche bez vaničky do 1,2 m od sprchy).',
      allowed: 'Bojler, svietidlá a ventilátory určené pre zónu 1. Zásuvky NIE (okrem holiacich transformátorov podľa normy).',
      ip: 'IPX4, pri tryskajúcej vode IPX5',
    },
    {
      id: '2', sk: 'Zóna 2 — pás 0,6 m okolo zóny 1', de: 'Bereich 2',
      geometry: 'Pás šírky 0,6 m vedľa zóny 1, do výšky 2,25 m.',
      allowed: 'Svietidlá, ventilátory, bojlery. Zásuvky podľa platnej normy a krajiny — OVER.',
      ip: 'IPX4',
    },
    {
      id: 'out', sk: 'Mimo zón', de: 'außerhalb der Bereiche',
      geometry: 'Zostatok kúpeľne.',
      allowed: 'Zásuvky a vypínače, všetko s RCD 30 mA.',
      ip: 'IP20 a viac podľa miesta',
    },
  ],
  general: [
    'RCD 30 mA pre všetky obvody v kúpeľni.',
    'Doplnkové ochranné pospájanie kovových častí — rieš podľa projektu a platnej normy.',
    'Rozvody veď vertikálne alebo horizontálne v dovolených zónach, aby sa dali nájsť.',
    'Vo zónach nesmú byť rozvodné krabice a svorkovnice (okrem výnimiek pre SELV).',
  ],
};

export const SYMBOLS = [
  { id: 'sw1', sk: 'Jednopólový vypínač', de: 'Ausschalter', mark: '1', note: 'Značka: kruh s čiarkou. Radenie 1.' },
  { id: 'sw5', sk: 'Sériový vypínač (dvojitý)', de: 'Serienschalter', mark: '5', note: 'Dve svetlá zvlášť z jedného miesta. Radenie 5.' },
  { id: 'sw6', sk: 'Striedavý prepínač', de: 'Wechselschalter', mark: '6', note: 'Dva prepínače, jedno svetlo. Radenie 6.' },
  { id: 'sw7', sk: 'Krížový prepínač', de: 'Kreuzschalter', mark: '7', note: 'Tretie a ďalšie miesto ovládania. Radenie 7.' },
  { id: 'sw0', sk: 'Tlačidlo (impulzné)', de: 'Taster', mark: '0', note: 'Pre impulzné relé (Stromstoßschalter).' },
  { id: 'socket', sk: 'Zásuvka', de: 'Steckdose', mark: '—', note: 'Kruh s čiarkou nahor. S PE má v značke zvislú čiarku.' },
  { id: 'light', sk: 'Svietidlo', de: 'Leuchte', mark: '—', note: 'Kruh s krížom.' },
  { id: 'db', sk: 'Rozvádzač', de: 'Verteiler / Unterverteilung', mark: 'RE / UV', note: 'Obdĺžnik s vnútorným delením.' },
  { id: 'mcb', sk: 'Istič', de: 'Leitungsschutzschalter (LS)', mark: 'Q', note: 'Obdĺžnik s krivkou vypnutia.' },
  { id: 'rcd', sk: 'Prúdový chránič', de: 'RCD / FI-Schalter', mark: 'FI', note: 'Obdĺžnik s krúžkom (súčtový transformátor).' },
  { id: 'contactor', sk: 'Stýkač', de: 'Schütz', mark: 'K / Q', note: 'Cievka A1-A2, hlavné kontakty 1-2, 3-4, 5-6.' },
  { id: 'relay', sk: 'Relé', de: 'Relais', mark: 'K', note: 'Cievka + prepínacie kontakty 11-12-14.' },
  { id: 'motor', sk: 'Motor', de: 'Motor', mark: 'M', note: 'Kruh s M. 3~ pre trojfázový.' },
  { id: 'trafo', sk: 'Transformátor', de: 'Transformator', mark: 'T', note: 'Dva kruhy alebo dve cievky.' },
  { id: 'earth', sk: 'Uzemnenie', de: 'Erdung', mark: 'PE', note: 'Tri klesajúce vodorovné čiarky.' },
  { id: 'bond', sk: 'Pospájanie', de: 'Potentialausgleich', mark: 'PA / HPA', note: 'Hlavná pospájacia prípojnica = HPAS / Haupterdungsschiene.' },
];

export const TERMINALS = [
  {
    id: 'contactor-coil',
    sk: 'Stýkač — cievka', de: 'Schützspule',
    marks: 'A1, A2',
    note: 'A1 a A2 sú vývody cievky. Napätie cievky je na stýkači napísané (230 V AC, 24 V DC…).',
  },
  {
    id: 'contactor-main',
    sk: 'Stýkač — hlavné kontakty', de: 'Hauptkontakte',
    marks: '1/L1–2/T1, 3/L2–4/T2, 5/L3–6/T3',
    note: 'Nepárne čísla = vstup (sieť), párne = výstup (motor). Číslovanie 1–6.',
  },
  {
    id: 'contactor-no',
    sk: 'Stýkač — pomocný zapínací (NO)', de: 'Schließer (NO)',
    marks: '13–14, 43–44, 53–54',
    note: 'Druhá číslica 3–4 = zapínací kontakt. Používa sa na samodržanie (Selbsthaltung).',
  },
  {
    id: 'contactor-nc',
    sk: 'Stýkač — pomocný rozpínací (NC)', de: 'Öffner (NC)',
    marks: '21–22, 31–32, 61–62',
    note: 'Druhá číslica 1–2 = rozpínací kontakt. Používa sa na blokovanie (Verriegelung).',
  },
  {
    id: 'overload',
    sk: 'Tepelné nadprúdové relé', de: 'Thermisches Überlastrelais',
    marks: '95–96 (NC), 97–98 (NO)',
    note: '95–96 rozpojí ovládací obvod pri preťažení. 97–98 slúži na signalizáciu.',
  },
  {
    id: 'relay-changeover',
    sk: 'Relé — prepínací kontakt', de: 'Wechsler',
    marks: '11 (spoločný), 12 (NC), 14 (NO)',
    note: 'Prvá číslica = číslo kontaktu, druhá = funkcia.',
  },
  {
    id: 'timer',
    sk: 'Časové relé', de: 'Zeitrelais',
    marks: '15–16–18 alebo 55–56–58',
    note: 'Pozor na rozdiel: oneskorený príťah (ON delay) vs. oneskorený odpad (OFF delay).',
  },
  {
    id: 'motor-terminals',
    sk: 'Svorkovnica motora', de: 'Motorklemmbrett',
    marks: 'U1 V1 W1 / U2 V2 W2 (staré: U V W / X Y Z)',
    note: 'Trojuholník (D): spojky U1-W2, V1-U2, W1-V2. Hviezda (Y): spojené W2-U2-V2.',
  },
];

export const TORQUES = {
  warn:
    'PRIORITU MÁ VŽDY ÚDAJ VÝROBCU svorky alebo prístroja. Tieto hodnoty sú len ' +
    'VŠEOBECNÁ POMÔCKA, keď nemáš po ruke návod. Pri Al svorkách a pri prípojniciach ' +
    'sa momenty výrazne líšia. Používaj momentový skrutkovač, nie cit.',
  rows: [
    { size: 'M2,5 / svorka do 1,5 mm²', nm: '0,4–0,5 N·m', note: 'Prístrojové svorky, relé.' },
    { size: 'M3 / svorka 1,5–2,5 mm²', nm: '0,5–0,8 N·m', note: 'Zásuvky, vypínače, radové svorky.' },
    { size: 'M3,5 / svorka 2,5–4 mm²', nm: '0,8–1,2 N·m', note: 'Ističe do 32 A.' },
    { size: 'M4 / svorka 4–10 mm²', nm: '1,2–2,0 N·m', note: 'Ističe 40–63 A, RCD.' },
    { size: 'M5 / svorka 10–25 mm²', nm: '2,0–3,0 N·m', note: 'Prívodné svorky rozvádzačov.' },
    { size: 'M6 / svorka 25–50 mm²', nm: '4,0–6,0 N·m', note: 'Hlavné vypínače, prípojnice.' },
    { size: 'M8 / svorka 50–120 mm²', nm: '9,0–12,0 N·m', note: 'Prípojnice, NH odpínače.' },
    { size: 'M10 / nad 120 mm²', nm: '14–20 N·m', note: 'Veľké prívody, prípojnice.' },
    { size: 'Al svorky', nm: 'podľa výrobcu', note: 'Al sa plasticky deformuje. Dotiahni, nechaj a dotiahni znova podľa návodu.' },
  ],
};

export const RCD_CURRENTS = [
  { id: '10mA', sk: '10 mA', use: 'Mimoriadne citlivé prostredie, zdravotníctvo, niektoré laboratóriá.' },
  { id: '30mA', sk: '30 mA', use: 'Ochrana osôb. Zásuvky, kúpeľne, vonku, stavenisko, wallbox.' },
  { id: '100mA', sk: '100 mA', use: 'Doplnková ochrana, selektivita voči 30 mA.' },
  { id: '300mA', sk: '300 mA', use: 'Požiarna ochrana rozvodov, nie ochrana osôb.' },
  { id: '500mA', sk: '500 mA', use: 'Predradený chránič v priemysle, požiarna ochrana.' },
];

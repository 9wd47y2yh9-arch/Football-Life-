import { Team, Position, Playstyle, PlayerStats, PracticeAbsenceReason, PracticeAbsenceReasonId } from '../types/footballLife';

export interface CountryData {
  id: string;
  name: string;
  flag: string;
  continent: string;
  firstNamesMale: string[];
  firstNamesFemale: string[];
  lastNames: string[];
  schools: {
    elementary: string[];
    middle: string[];
    high: string[];
    university: string[];
  };
  youthTeams: Array<{
    name: string;
    category: Team['category'];
    level: number;
    practiceDaysPerWeek: number;
    practiceSchedule: number[];
    tactic: Team['tactic'];
    coachName: string;
    coachStyle: Team['coachStyle'];
  }>;
  famousClubs: string[];
}

export const COUNTRIES: Record<string, CountryData> = {
  japan: {
    id: 'japan',
    name: '日本',
    flag: '🇯🇵',
    continent: 'アジア',
    firstNamesMale: ['翔太', '大和', '蓮', '蒼空', '陸', '悠真', '拓海', '颯太', '健斗', '湊', '駿', '樹', '航平', '陽翔'],
    firstNamesFemale: ['葵', '結衣', '陽菜', '咲良', '凛', '美咲', '芽依', '優奈', '結菜', '花音', '美月', '琴音'],
    lastNames: ['佐藤', '鈴木', '高橋', '田中', '渡辺', '伊藤', '中村', '小林', '加藤', '吉田', '山田', '佐々木', '山口', '松本', '井上'],
    schools: {
      elementary: ['桜ヶ丘第一小学校', '緑が丘小学校', '南陽小学校', '東台小学校'],
      middle: ['南が丘中学校', '桜ヶ丘中学校', '青葉中学校', '城北中学校'],
      high: ['青森山田中高', '市立船橋高校', '東福岡高校', '静学サッカー高', '帝京長岡高校', '桐光学園高校'],
      university: ['流通経済大学', '明治大学', '筑波大学', '法政大学', '早稲田大学']
    },
    youthTeams: [
      {
        name: '南が丘FCジュニア (地元の街クラブ)',
        category: 'local_youth',
        level: 2,
        practiceDaysPerWeek: 3,
        practiceSchedule: [2, 4, 6], // 火・木・土
        tactic: 'balanced',
        coachName: '佐々木 監督',
        coachStyle: 'nurturing'
      },
      {
        name: '東京ヴェルディジュニア (強豪クラブチーム)',
        category: 'club_team',
        level: 4,
        practiceDaysPerWeek: 4,
        practiceSchedule: [1, 2, 4, 6], // 月・火・木・土
        tactic: 'possession',
        coachName: '工藤 監督',
        coachStyle: 'tactical'
      },
      {
        name: '川崎フロンターレU-12 (J下部アカデミー)',
        category: 'j_youth',
        level: 5,
        practiceDaysPerWeek: 5,
        practiceSchedule: [1, 2, 3, 5, 6],
        tactic: 'possession',
        coachName: '小野 監督',
        coachStyle: 'strict'
      },
      {
        name: '桜ヶ丘SC (育成特化少年団)',
        category: 'local_youth',
        level: 2,
        practiceDaysPerWeek: 3,
        practiceSchedule: [3, 5, 6],
        tactic: 'counter',
        coachName: '本田 監督',
        coachStyle: 'passionate'
      },
      {
        name: '横浜F・マリノスプライマリー (J下部)',
        category: 'j_youth',
        level: 5,
        practiceDaysPerWeek: 5,
        practiceSchedule: [1, 2, 4, 5, 6],
        tactic: 'high_press',
        coachName: '中島 監督',
        coachStyle: 'strict'
      }
    ],
    famousClubs: ['川崎フロンターレ', '横浜F・マリノス', '浦和レッズ', '鹿島アントラーズ', 'ヴィッセル神戸', 'FC東京', 'ガンバ大阪', '名古屋グランパス']
  },
  spain: {
    id: 'spain',
    name: 'スペイン',
    flag: '🇪🇸',
    continent: 'ヨーロッパ',
    firstNamesMale: ['Alejandro', 'Mateo', 'Lucas', 'Leo', 'Hugo', 'Daniel', 'Pablo', 'Manuel', 'Álvaro', 'Carlos', 'Diego', 'Javier'],
    firstNamesFemale: ['Lucía', 'Sofía', 'Martina', 'María', 'Paula', 'Julia', 'Emma', 'Valeria', 'Alba', 'Claudia', 'Elena'],
    lastNames: ['García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Martín', 'Navarro', 'Torres'],
    schools: {
      elementary: ['Colegio San Fernando', 'Escuela Cervantes', 'Colegio Los Rosales', 'Instituto Madrid Sur'],
      middle: ['IES Salvador Dalí', 'Colegio Santa María', 'Instituto Goya', 'IES Las Rozas'],
      high: ['Colegio Mayor Ramiro', 'IES Isabel la Católica', 'Instituto Europa', 'Academia Fútbol Madrid'],
      university: ['Universidad Complutense', 'Universidad Autónoma de Madrid', 'Universidad de Barcelona']
    },
    youthTeams: [
      {
        name: 'CF Cantera Madrid (地域の育成クラブ)',
        category: 'local_youth',
        level: 3,
        practiceDaysPerWeek: 3,
        practiceSchedule: [2, 4, 6],
        tactic: 'possession',
        coachName: 'Entrenador Raúl Morales',
        coachStyle: 'tactical'
      },
      {
        name: 'CD Juvenil Chamartín (マドリード名門ユース)',
        category: 'club_team',
        level: 4,
        practiceDaysPerWeek: 4,
        practiceSchedule: [1, 2, 4, 6],
        tactic: 'direct',
        coachName: 'Entrenador Fernando Ortiz',
        coachStyle: 'strict'
      },
      {
        name: 'Atlético Juvenil Sur (名門下部カンテラ)',
        category: 'overseas_youth',
        level: 5,
        practiceDaysPerWeek: 5,
        practiceSchedule: [1, 2, 3, 5, 6],
        tactic: 'high_press',
        coachName: 'Mister Diego Vicente',
        coachStyle: 'passionate'
      },
      {
        name: 'FC Barcelona La Masia (世界的トップカンテラ)',
        category: 'overseas_youth',
        level: 5,
        practiceDaysPerWeek: 5,
        practiceSchedule: [1, 2, 4, 5, 6],
        tactic: 'possession',
        coachName: 'Mister Xavi Beltrán',
        coachStyle: 'tactical'
      }
    ],
    famousClubs: ['Real Madrid', 'FC Barcelona', 'Atlético Madrid', 'Real Sociedad', 'Athletic Club', 'Valencia CF', 'Sevilla FC', 'Real Betis']
  },
  england: {
    id: 'england',
    name: 'イングランド',
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    continent: 'ヨーロッパ',
    firstNamesMale: ['Oliver', 'George', 'Harry', 'Jack', 'Noah', 'Leo', 'Arthur', 'Oscar', 'Charlie', 'Freddie', 'Archie', 'Ethan'],
    firstNamesFemale: ['Olivia', 'Amelia', 'Isla', 'Ava', 'Mia', 'Ivy', 'Lily', 'Freya', 'Florence', 'Grace', 'Emily', 'Sophie'],
    lastNames: ['Smith', 'Jones', 'Taylor', 'Brown', 'Williams', 'Wilson', 'Johnson', 'Davies', 'Robinson', 'Wright', 'Walker', 'Hall'],
    schools: {
      elementary: ['St. George Primary School', 'Oakfield Junior School', 'Hampstead Grove Primary', 'Kingswood Academy'],
      middle: ['St. Jude Secondary Academy', 'Wembley Park High', 'Highgate Grammar School', 'Kingston Hill College'],
      high: ['Harrow County College', 'Richmond Collegiate High', 'Fulham Cross Academy', 'St. Peters Sixth Form'],
      university: ['Loughborough University', 'King’s College London', 'University of Manchester']
    },
    youthTeams: [
      {
        name: 'London Grassroots Colts (地域サンデーユース)',
        category: 'local_youth',
        level: 2,
        practiceDaysPerWeek: 3,
        practiceSchedule: [2, 4, 6],
        tactic: 'direct',
        coachName: 'Coach Mark Harris',
        coachStyle: 'passionate'
      },
      {
        name: 'North London Juniors Academy (名門アカデミー)',
        category: 'club_team',
        level: 4,
        practiceDaysPerWeek: 4,
        practiceSchedule: [1, 3, 5, 6],
        tactic: 'high_press',
        coachName: 'Coach Simon Campbell',
        coachStyle: 'strict'
      },
      {
        name: 'Cobham Blue Lions Academy (プレミア名門ユース)',
        category: 'overseas_youth',
        level: 5,
        practiceDaysPerWeek: 5,
        practiceSchedule: [1, 2, 4, 5, 6],
        tactic: 'possession',
        coachName: 'Coach Paul Richardson',
        coachStyle: 'tactical'
      },
      {
        name: 'Merseyside Red Academy (名門下部組織)',
        category: 'overseas_youth',
        level: 5,
        practiceDaysPerWeek: 5,
        practiceSchedule: [1, 2, 3, 5, 6],
        tactic: 'high_press',
        coachName: 'Coach Dave Gallagher',
        coachStyle: 'nurturing'
      }
    ],
    famousClubs: ['Manchester City', 'Arsenal', 'Liverpool', 'Chelsea', 'Manchester United', 'Tottenham', 'Aston Villa', 'Newcastle']
  },
  germany: {
    id: 'germany',
    name: 'ドイツ',
    flag: '🇩🇪',
    continent: 'ヨーロッパ',
    firstNamesMale: ['Lukas', 'Maximilian', 'Leon', 'Felix', 'Jonas', 'Elias', 'Paul', 'Noah', 'Finn', 'Ben', 'Moritz', 'Julian'],
    firstNamesFemale: ['Emma', 'Mia', 'Hannah', 'Sophia', 'Emilia', 'Lina', 'Marie', 'Ella', 'Clara', 'Lea', 'Leni', 'Anna'],
    lastNames: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann', 'Schäfer', 'Koch'],
    schools: {
      elementary: ['Theodor-Heuss-Grundschule', 'Goethe-Schule', 'Schiller-Grundschule', 'Brüder-Grimm-Schule'],
      middle: ['Wilhelm-Gymnasium', 'Heinrich-Heine-Realschule', 'Humboldt-Gymnasium', 'Geschwister-Scholl-Schule'],
      high: ['Kaiserin-Friedrich-Gymnasium', 'Sportgymnasium Dortmund', 'Leibniz-Gymnasium München', 'Eliteschule des Sports'],
      university: ['Deutsche Sporthochschule Köln', 'LMU München', 'TU Berlin']
    },
    youthTeams: [
      {
        name: 'Ruhr Talente e.V. (地域クラブ)',
        category: 'local_youth',
        level: 3,
        practiceDaysPerWeek: 3,
        practiceSchedule: [1, 3, 5],
        tactic: 'counter',
        coachName: 'Trainer Klaus Becker',
        coachStyle: 'strict'
      },
      {
        name: 'Schwarzwald Jugend Akademie (育成型クラブ)',
        category: 'club_team',
        level: 4,
        practiceDaysPerWeek: 4,
        practiceSchedule: [1, 2, 4, 6],
        tactic: 'high_press',
        coachName: 'Trainer Stefan Wagner',
        coachStyle: 'tactical'
      },
      {
        name: 'Bayern Talente NLZ (ブンデス名門育成機関)',
        category: 'overseas_youth',
        level: 5,
        practiceDaysPerWeek: 5,
        practiceSchedule: [1, 2, 3, 5, 6],
        tactic: 'possession',
        coachName: 'Trainer Michael Richter',
        coachStyle: 'strict'
      }
    ],
    famousClubs: ['FC Bayern München', 'Borussia Dortmund', 'Bayer Leverkusen', 'RB Leipzig', 'Eintracht Frankfurt', 'VfB Stuttgart']
  },
  france: {
    id: 'france',
    name: 'フランス',
    flag: '🇫🇷',
    continent: 'ヨーロッパ',
    firstNamesMale: ['Gabriel', 'Léo', 'Raphaël', 'Arthur', 'Louis', 'Lucas', 'Adam', 'Jules', 'Hugo', 'Maël', 'Liam', 'Enzo'],
    firstNamesFemale: ['Jade', 'Louise', 'Ambre', 'Alba', 'Emma', 'Rose', 'Alice', 'Romy', 'Anna', 'Lina', 'Léna', 'Chloé'],
    lastNames: ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent'],
    schools: {
      elementary: ['École Jean Jaurès', 'École Victor Hugo', 'École Jules Ferry', 'École Saint-Exupéry'],
      middle: ['Collège Paul Valéry', 'Collège François Villon', 'Collège Voltaire', 'Collège Jean Moulin'],
      high: ['Lycée Henri IV', 'Lycée Condorcet', 'Lycée Charlemagne', 'Lycée Sportif Clairefontaine'],
      university: ['Sorbonne Université', 'Université Paris-Saclay', 'Université de Lyon']
    },
    youthTeams: [
      {
        name: 'Banlieue Étoile FC (パリ郊外の原石クラブ)',
        category: 'local_youth',
        level: 3,
        practiceDaysPerWeek: 4,
        practiceSchedule: [1, 3, 5, 6],
        tactic: 'high_press',
        coachName: 'Coach Antoine Moreau',
        coachStyle: 'passionate'
      },
      {
        name: 'Lyon Académie Espoirs (育成名門アカデミー)',
        category: 'overseas_youth',
        level: 5,
        practiceDaysPerWeek: 5,
        practiceSchedule: [1, 2, 3, 5, 6],
        tactic: 'possession',
        coachName: 'Coach Jean-Luc Mercier',
        coachStyle: 'tactical'
      },
      {
        name: 'Paris Saint-Germain Centre de Formation (最高峰下部)',
        category: 'overseas_youth',
        level: 5,
        practiceDaysPerWeek: 5,
        practiceSchedule: [1, 2, 4, 5, 6],
        tactic: 'possession',
        coachName: 'Coach Fabrice Blanc',
        coachStyle: 'strict'
      }
    ],
    famousClubs: ['Paris Saint-Germain', 'Olympique Lyonnais', 'Olympique de Marseille', 'AS Monaco', 'Lille OSC', 'Stade Rennais']
  },
  italy: {
    id: 'italy',
    name: 'イタリア',
    flag: '🇮🇹',
    continent: 'ヨーロッパ',
    firstNamesMale: ['Leonardo', 'Francesco', 'Alessandro', 'Lorenzo', 'Mattia', 'Andrea', 'Gabriele', 'Riccardo', 'Tommaso', 'Edoardo', 'Matteo'],
    firstNamesFemale: ['Sofia', 'Aurora', 'Giulia', 'Ginevra', 'Beatrice', 'Alice', 'Vittoria', 'Emma', 'Giorgia', 'Chiara', 'Matilde'],
    lastNames: ['Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo'],
    schools: {
      elementary: ['Scuola Primaria Dante Alighieri', 'Scuola De Amicis', 'Scuola Carducci', 'Scuola Marconi'],
      middle: ['Scuola Media Giuseppe Verdi', 'Scuola Media Leonardo da Vinci', 'Scuola Media Foscolo'],
      high: ['Liceo Classico Parini', 'Liceo Scientifico Volta', 'Liceo Sportivo Milano', 'Liceo Manzoni'],
      university: ['Università di Bologna', 'Sapienza Università di Roma', 'Università degli Studi di Milano']
    },
    youthTeams: [
      {
        name: 'Torino Calcio Giovanili (伝統の育成クラブ)',
        category: 'local_youth',
        level: 3,
        practiceDaysPerWeek: 3,
        practiceSchedule: [2, 4, 6],
        tactic: 'counter',
        coachName: 'Mister Marco Ferrara',
        coachStyle: 'strict'
      },
      {
        name: 'Milano Primavera Talenti (北イタリア名門ユース)',
        category: 'overseas_youth',
        level: 5,
        practiceDaysPerWeek: 5,
        practiceSchedule: [1, 2, 3, 5, 6],
        tactic: 'tactical' as any,
        coachName: 'Mister Roberto Mancini',
        coachStyle: 'tactical'
      },
      {
        name: 'Roma Giovanissimi (首都のエリート育成機関)',
        category: 'club_team',
        level: 4,
        practiceDaysPerWeek: 4,
        practiceSchedule: [1, 3, 5, 6],
        tactic: 'possession',
        coachName: 'Mister Claudio Rossi',
        coachStyle: 'passionate'
      }
    ],
    famousClubs: ['Juventus', 'Inter Milan', 'AC Milan', 'AS Roma', 'Napoli', 'SS Lazio', 'Atalanta', 'Fiorentina']
  },
  netherlands: {
    id: 'netherlands',
    name: 'オランダ',
    flag: '🇳🇱',
    continent: 'ヨーロッパ',
    firstNamesMale: ['Noah', 'Sem', 'Lucas', 'Liam', 'Finn', 'Daan', 'Milan', 'Levi', 'Luuk', 'Bram', 'Jesse', 'Stijn'],
    firstNamesFemale: ['Emma', 'Julia', 'Mila', 'Tess', 'Sophie', 'Zoë', 'Sara', 'Nora', 'Evi', 'Lieke', 'Yara', 'Fleur'],
    lastNames: ['de Jong', 'Jansen', 'de Vries', 'van de Berg', 'van Dijk', 'Bakker', 'Janssen', 'Visser', 'Smit', 'Meijer', 'de Boer', 'Mulder'],
    schools: {
      elementary: ['Basisschool De Regenboog', 'Koningin Wilhelminaschool', 'Jan Ligthartschool', 'De Horizon'],
      middle: ['Het Amsterdams Lyceum', 'Erasmus College', 'Willem de Zwijger College', 'Montessori Lyceum'],
      high: ['Barlaeus Gymnasium', 'Stedelijk Gymnasium Leiden', 'Vossius Gymnasium', 'SportCollege Amsterdam'],
      university: ['Universiteit van Amsterdam', 'Universiteit Utrecht', 'Erasmus Universiteit Rotterdam']
    },
    youthTeams: [
      {
        name: 'Amsterdam Talenten Jeugd (地域アカデミー)',
        category: 'local_youth',
        level: 3,
        practiceDaysPerWeek: 3,
        practiceSchedule: [2, 4, 6],
        tactic: 'possession',
        coachName: 'Trainer Jan van Dijk',
        coachStyle: 'tactical'
      },
      {
        name: 'De Toekomst Ajax Academy (世界屈指の育成名門)',
        category: 'overseas_youth',
        level: 5,
        practiceDaysPerWeek: 5,
        practiceSchedule: [1, 2, 4, 5, 6],
        tactic: 'possession',
        coachName: 'Trainer Dennis de Boer',
        coachStyle: 'tactical'
      },
      {
        name: 'Feyenoord Varkenoord (ロッテルダム名門アカデミー)',
        category: 'overseas_youth',
        level: 4,
        practiceDaysPerWeek: 4,
        practiceSchedule: [1, 3, 5, 6],
        tactic: 'high_press',
        coachName: 'Trainer Robin Bakker',
        coachStyle: 'passionate'
      }
    ],
    famousClubs: ['AFC Ajax', 'PSV Eindhoven', 'Feyenoord Rotterdam', 'AZ Alkmaar', 'FC Twente', 'FC Utrecht']
  },
  brazil: {
    id: 'brazil',
    name: 'ブラジル',
    flag: '🇧🇷',
    continent: '南米',
    firstNamesMale: ['Gabriel', 'Davi', 'Arthur', 'Bernardo', 'Heitor', 'Pedro', 'Lorenzo', 'Lucas', 'Matheus', 'Enzo', 'Guilherme', 'Felipe'],
    firstNamesFemale: ['Alice', 'Sophia', 'Helena', 'Valentina', 'Laura', 'Isabella', 'Manuela', 'Júlia', 'Heloísa', 'Luiza', 'Maria'],
    lastNames: ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro'],
    schools: {
      elementary: ['Escola Municipal Monteiro Lobato', 'Colégio São Paulo', 'Escola Tiradentes', 'Colégio Santos Dumont'],
      middle: ['Colégio Pedro II', 'Colégio Santo Agostinho', 'Escola Estadual Barão de Mauá'],
      high: ['Colégio Bandeirantes', 'Colégio Visconde de Porto Seguro', 'Instituto de Educação do Rio'],
      university: ['Universidade de São Paulo', 'Universidade Estadual de Campinas', 'UFRJ']
    },
    youthTeams: [
      {
        name: 'Favela Estrelas FC (地域のテクニカル少年団)',
        category: 'local_youth',
        level: 3,
        practiceDaysPerWeek: 4,
        practiceSchedule: [1, 3, 5, 6],
        tactic: 'possession',
        coachName: 'Professor Zé Carlos',
        coachStyle: 'nurturing'
      },
      {
        name: 'Santos Meninos da Vila (王国の名門カンテラ)',
        category: 'overseas_youth',
        level: 5,
        practiceDaysPerWeek: 5,
        practiceSchedule: [1, 2, 3, 5, 6],
        tactic: 'possession',
        coachName: 'Professor Paulo Roberto',
        coachStyle: 'tactical'
      },
      {
        name: 'Flamengo Garotos do Ninho (リオの名門育成組織)',
        category: 'overseas_youth',
        level: 5,
        practiceDaysPerWeek: 5,
        practiceSchedule: [1, 2, 4, 5, 6],
        tactic: 'high_press',
        coachName: 'Professor Marcio Silva',
        coachStyle: 'passionate'
      }
    ],
    famousClubs: ['Santos FC', 'CR Flamengo', 'Palmeiras', 'São Paulo FC', 'Corinthians', 'Grêmio', 'Fluminense', 'Cruzeiro']
  },
  argentina: {
    id: 'argentina',
    name: 'アルゼンチン',
    flag: '🇦🇷',
    continent: '南米',
    firstNamesMale: ['Benjamín', 'Mateo', 'Bautista', 'Thiago', 'Felipe', 'Santiago', 'Santino', 'Joaquín', 'Lautaro', 'Ignacio', 'Tomás'],
    firstNamesFemale: ['Emma', 'Martina', 'Catalina', 'Mía', 'Sofía', 'Olivia', 'Alma', 'Delfina', 'Valentina', 'Isabella'],
    lastNames: ['González', 'Rodríguez', 'López', 'Fernández', 'Gómez', 'Díaz', 'Martínez', 'Pérez', 'Romero', 'Sánchez', 'Álvarez'],
    schools: {
      elementary: ['Escuela Primaria Sarmiento', 'Escuela General San Martín', 'Colegio Belgrano', 'Escuela Mitre'],
      middle: ['Colegio Nacional de Buenos Aires', 'Escuela Superior de Comercio Carlos Pellegrini'],
      high: ['Instituto San Román', 'Colegio Marín', 'Liceo Francés Jean Mermoz'],
      university: ['Universidad de Buenos Aires', 'Universidad Nacional de La Plata']
    },
    youthTeams: [
      {
        name: 'Potrero y Pasión Juniors (地域少年クラブ)',
        category: 'local_youth',
        level: 3,
        practiceDaysPerWeek: 3,
        practiceSchedule: [2, 4, 6],
        tactic: 'direct',
        coachName: 'Profe Diego Romero',
        coachStyle: 'passionate'
      },
      {
        name: 'River Plate Cantera de Núñez (名門アカデミー)',
        category: 'overseas_youth',
        level: 5,
        practiceDaysPerWeek: 5,
        practiceSchedule: [1, 2, 4, 5, 6],
        tactic: 'possession',
        coachName: 'Profe Marcelo Gómez',
        coachStyle: 'tactical'
      },
      {
        name: 'Boca Juniors Casa Amarilla (激闘の名門下部)',
        category: 'overseas_youth',
        level: 5,
        practiceDaysPerWeek: 5,
        practiceSchedule: [1, 2, 3, 5, 6],
        tactic: 'high_press',
        coachName: 'Profe Jorge Batista',
        coachStyle: 'strict'
      }
    ],
    famousClubs: ['River Plate', 'Boca Juniors', 'Racing Club', 'Independiente', 'San Lorenzo', 'Estudiantes']
  }
};

export const POSITIONS: Array<{ id: Position; label: string; area: string; desc: string }> = [
  { id: 'GK', label: 'GK (ゴールキーパー)', area: 'GK', desc: 'ゴールを守る最後の砦。反射神経と統率力' },
  { id: 'CB', label: 'CB (センターバック)', area: 'DF', desc: '守備の要。対人守備、高さ、ビルドアップ' },
  { id: 'SB', label: 'SB (サイドバック)', area: 'DF', desc: '上下動とクロス、サイドの攻防を制する' },
  { id: 'DMF', label: 'DMF (守備的MF)', area: 'MF', desc: '中盤の防波堤・ボール奪取と配給の司令塔' },
  { id: 'CMF', label: 'CMF (セントラルMF)', area: 'MF', desc: '攻守をつなぐリンクマン・豊富な運動量' },
  { id: 'OMF', label: 'OMF (攻撃的MF)', area: 'MF', desc: '決定的なラストパスと得点力を兼ね備えるトップ下' },
  { id: 'WG', label: 'WG (ウイング)', area: 'FW', desc: 'スピードとテクニックでサイドを切り裂くドリブラー' },
  { id: 'ST', label: 'ST (セカンドトップ)', area: 'FW', desc: '前線で起点を作り自らも狙うシャドーストライカー' },
  { id: 'CF', label: 'CF (センターフォワード)', area: 'FW', desc: 'ゴールを奪う主役。ポストプレーと決定力' },
];

export function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export interface PlaystyleDefinition {
  id: Playstyle;
  name: string;
  category: 'FW' | 'MF' | 'DF' | 'GK';
  compatiblePositions: Position[];
  description: string;
  growthBonus: Array<keyof PlayerStats>;
  roleSummary: string;
}

export const PLAYSTYLES: Record<Playstyle, PlaystyleDefinition> = {
  line_breaker: {
    id: 'line_breaker',
    name: 'ラインブレーカー',
    category: 'FW',
    compatiblePositions: ['CF', 'ST', 'WG'],
    description: '相手最終ラインの裏へ一瞬の加速で抜け出し、決定的なゴールを奪う俊足ストライカー。',
    growthBonus: ['pace', 'shooting'],
    roleSummary: '裏抜け・オフザボールでの決定機量産'
  },
  chance_maker: {
    id: 'chance_maker',
    name: 'チャンスメイカー',
    category: 'FW',
    compatiblePositions: ['CF', 'ST', 'WG', 'OMF'],
    description: '前線から下がってボールを受け、味方を生かすスルーパスや決定的な仕掛けを生み出す。',
    growthBonus: ['passing', 'dribbling'],
    roleSummary: '起点作り・前線でのラストパス'
  },
  decoy_run: {
    id: 'decoy_run',
    name: 'デコイラン',
    category: 'FW',
    compatiblePositions: ['CF', 'ST'],
    description: '意図的な囮のフリーランニングで相手守備陣を引き連れ、味方のシュートコースや侵入経路を切り拓く。',
    growthBonus: ['tacticalSense', 'stamina'],
    roleSummary: '囮のフリーラン・味方のスペース創出'
  },
  box_striker: {
    id: 'box_striker',
    name: 'ボックスストライカー',
    category: 'FW',
    compatiblePositions: ['CF', 'ST'],
    description: 'ペナルティエリア内での嗅覚と決定力に特化し、ワンタッチでネットを揺らす点取り屋。',
    growthBonus: ['shooting', 'mental'],
    roleSummary: 'ペナルティエリア内での決定打'
  },
  target_man: {
    id: 'target_man',
    name: 'ターゲットマン',
    category: 'FW',
    compatiblePositions: ['CF', 'ST'],
    description: '強靭なフィジカルと高さを武器に、前線で長いボールをキープして味方の攻め上がりを待つ基準点。',
    growthBonus: ['physical', 'shooting'],
    roleSummary: '前線でのポストプレー・空中戦の基準点'
  },
  wing_striker: {
    id: 'wing_striker',
    name: 'ウイングストライカー',
    category: 'FW',
    compatiblePositions: ['WG', 'ST'],
    description: 'タッチライン際から斜めにペナルティエリアへ切れ込み、鋭いシュートで直接ゴールを仕留める。',
    growthBonus: ['pace', 'shooting', 'dribbling'],
    roleSummary: 'サイドからのカットイン・フィニッシュ'
  },
  creative_playmaker: {
    id: 'creative_playmaker',
    name: '創造型MF',
    category: 'MF',
    compatiblePositions: ['OMF', 'CMF'],
    description: '高いテクニックと広い視野で攻撃のタクトを振るい、相手の隙を突く芸術的なパスで崩す司令塔。',
    growthBonus: ['passing', 'dribbling', 'tacticalSense'],
    roleSummary: 'ゲームメイク・決定的一撃の演出'
  },
  defensive_midfielder: {
    id: 'defensive_midfielder',
    name: '守備型MF',
    category: 'MF',
    compatiblePositions: ['DMF', 'CMF'],
    description: '鋭い読みと激しいタックルで相手の攻撃の芽を素早く摘み取る、中盤の絶対的フィルター。',
    growthBonus: ['defending', 'physical', 'tacticalSense'],
    roleSummary: '中盤でのボール奪取・ピンチの芽を摘む'
  },
  anchor: {
    id: 'anchor',
    name: 'アンカー',
    category: 'MF',
    compatiblePositions: ['DMF'],
    description: 'センターバックの手前に常に位置取り、守備陣のカバーリングとシンプルな球出しに徹する防波堤。',
    growthBonus: ['defending', 'tacticalSense', 'passing'],
    roleSummary: 'ディフェンスラインの防波堤・配球'
  },
  box_to_box: {
    id: 'box_to_box',
    name: 'ボックストゥボックス',
    category: 'MF',
    compatiblePositions: ['CMF', 'DMF', 'OMF'],
    description: '無尽蔵のスタミナで自陣ゴール前から相手ゴール前までピッチ全面を走り回り、攻守両面で貢献する。',
    growthBonus: ['stamina', 'physical', 'mental'],
    roleSummary: 'ピッチ全域の制圧・豊富な運動量'
  },
  offensive_sideback: {
    id: 'offensive_sideback',
    name: '攻撃的SB',
    category: 'DF',
    compatiblePositions: ['SB'],
    description: '積極的なオーバーラップで高い位置を奪い、高精度のクロスや内側への侵入で攻撃に厚みをもたらす。',
    growthBonus: ['pace', 'passing', 'stamina'],
    roleSummary: 'サイドの高速突破・高精度クロス'
  },
  defensive_sideback: {
    id: 'defensive_sideback',
    name: '守備型SB',
    category: 'DF',
    compatiblePositions: ['SB'],
    description: '無理な攻め上がりを自制し、1対1の対人守備とカバーリングでサイドの侵入を許さない堅実派。',
    growthBonus: ['defending', 'physical', 'tacticalSense'],
    roleSummary: 'サイドの完全封鎖・対人守備'
  },
  build_up_cb: {
    id: 'build_up_cb',
    name: 'ビルドアップ型CB',
    category: 'DF',
    compatiblePositions: ['CB'],
    description: '最後尾から長短のパスを自在に配給し、チームの攻撃の第一歩を組み立てる近代的なセンターバック。',
    growthBonus: ['passing', 'tacticalSense', 'defending'],
    roleSummary: '最後尾からの高精度フィード・組み立て'
  },
  stopper_cb: {
    id: 'stopper_cb',
    name: '守備型CB',
    category: 'DF',
    compatiblePositions: ['CB'],
    description: '強靭な肉体と空中戦の強さ、泥臭いシュートブロックで相手ストライカーを完封する守備職人。',
    growthBonus: ['defending', 'physical', 'mental'],
    roleSummary: 'ストライカー封殺・空中戦と対人デュエル'
  },
  offensive_gk: {
    id: 'offensive_gk',
    name: '攻撃型GK',
    category: 'GK',
    compatiblePositions: ['GK'],
    description: 'ペナルティエリア外まで広くカバーするスイーパーGK。味方への的確なフィードで攻撃起点にもなる。',
    growthBonus: ['tacticalSense', 'passing', 'pace'],
    roleSummary: '広い守備範囲・飛び出しとフィード'
  },
  defensive_gk: {
    id: 'defensive_gk',
    name: '守備型GK',
    category: 'GK',
    compatiblePositions: ['GK'],
    description: 'ゴールマウスを守ることに専念し、至近距離からのシュートに超人的な反応を見せる守護神。',
    growthBonus: ['mental', 'physical', 'defending'],
    roleSummary: '神がかり的セービング・ゴール死守'
  }
};

export function getCompatiblePlaystyles(pos: Position): PlaystyleDefinition[] {
  return Object.values(PLAYSTYLES).filter(p => p.compatiblePositions.includes(pos));
}

export const PRACTICE_ABSENCE_REASONS: Record<PracticeAbsenceReasonId, PracticeAbsenceReason> = {
  illness: {
    id: 'illness',
    label: '体調不良 (発熱・風邪など)',
    category: 'legitimate',
    baseTrustImpact: 0,
    baseAttitudeImpact: 0,
    coachMessage: '無理して来ても悪化させるだけだ。しっかり体を休めて早く治せよ。'
  },
  injury: {
    id: 'injury',
    label: '怪我・患部の痛み',
    category: 'legitimate',
    baseTrustImpact: 0,
    baseAttitudeImpact: 0,
    coachMessage: '怪我の悪化を防ぐのが最優先だ。アイシングとケアに専念しろ。'
  },
  school_event: {
    id: 'school_event',
    label: '学校行事 (修学旅行・文化祭など)',
    category: 'legitimate',
    baseTrustImpact: 0,
    baseAttitudeImpact: 0,
    coachMessage: '学校の行事は学生として大切なことだ。気兼ねなく行ってこい。'
  },
  exam: {
    id: 'exam',
    label: '定期テスト・勉強専念',
    category: 'legitimate',
    baseTrustImpact: -1,
    baseAttitudeImpact: -1,
    coachMessage: '文武両道は大切だ。しっかり点数を取って、終わったらまたボールを蹴ろう。'
  },
  family: {
    id: 'family',
    label: '家族の冠婚葬祭・家庭の用事',
    category: 'legitimate',
    baseTrustImpact: 0,
    baseAttitudeImpact: 0,
    coachMessage: '家庭の事情なら仕方ない。落ち着いたら元気に戻っておいで。'
  },
  hospital: {
    id: 'hospital',
    label: '通院・定期検診',
    category: 'legitimate',
    baseTrustImpact: 0,
    baseAttitudeImpact: 0,
    coachMessage: '医師の診察を優先してくれ。結果はまた教えてくれよ。'
  },
  fatigue: {
    id: 'fatigue',
    label: '強い疲労・コンディション調整',
    category: 'legitimate',
    baseTrustImpact: -1,
    baseAttitudeImpact: -1,
    coachMessage: 'オーバーワークで大怪我をされるよりは休養も戦術だ。明日はしっかり動けよ。'
  },
  coach_consulted: {
    id: 'coach_consulted',
    label: '監督に事前相談済み',
    category: 'legitimate',
    baseTrustImpact: 0,
    baseAttitudeImpact: 0,
    coachMessage: '事前に連絡があった通りだな。手続き通り受領した。'
  },
  personal: {
    id: 'personal',
    label: '個人的な事情',
    category: 'doubtful',
    baseTrustImpact: -2,
    baseAttitudeImpact: -2,
    coachMessage: '何か悩み事でもあるのか？あまり一人で抱え込まずに相談しろよ。'
  },
  friend_hangout: {
    id: 'friend_hangout',
    label: '友達との先約・お出かけ',
    category: 'doubtful',
    baseTrustImpact: -4,
    baseAttitudeImpact: -4,
    coachMessage: '部活やチームの練習より遊びを優先する姿勢は感心しないな。'
  },
  overslept: {
    id: 'overslept',
    label: '寝坊して時間に間に合わなかった',
    category: 'unexcused',
    baseTrustImpact: -6,
    baseAttitudeImpact: -6,
    coachMessage: '自己管理の甘さだ。プロを目指す自覚が足りないんじゃないか？'
  },
  played: {
    id: 'played',
    label: 'ゲームセンターや買い物に遊びに行った',
    category: 'unexcused',
    baseTrustImpact: -8,
    baseAttitudeImpact: -8,
    coachMessage: '真剣に汗を流している仲間に顔向けできるのか？猛省しろ。'
  },
  gaming: {
    id: 'gaming',
    label: '家でゲームをしていた',
    category: 'unexcused',
    baseTrustImpact: -9,
    baseAttitudeImpact: -9,
    coachMessage: '話にならんな。サッカーへの熱意はその程度なのか？'
  },
  slacked: {
    id: 'slacked',
    label: '単純に練習をサボった（無断・怠惰）',
    category: 'unexcused',
    baseTrustImpact: -12,
    baseAttitudeImpact: -12,
    coachMessage: 'チームの和と規律を乱す最悪の行為だ。次の試合の起用は見直させてもらう。'
  },
  other: {
    id: 'other',
    label: 'その他 (自由記述)',
    category: 'doubtful',
    baseTrustImpact: -2,
    baseAttitudeImpact: -2,
    coachMessage: '事情は受け取った。日々の姿勢を怠らないようにしてくれ。'
  }
};

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
    famousClubs: ['ヴィッセル神戸', '川崎フロンターレ', '横浜F・マリノス', '浦和レッズ', 'ガンバ大阪', '鹿島アントラーズ', 'サンフレッチェ広島', 'FC東京', 'セレッソ大阪', '名古屋グランパス']
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
    famousClubs: ['FC Barcelona', 'Real Madrid', 'Atlético Madrid', 'Real Sociedad', 'Athletic Club', 'Valencia CF', 'Sevilla FC', 'Real Betis', 'Villarreal CF']
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
  fatigue: {
    id: 'fatigue',
    label: '疲労（激しい疲労の蓄積）',
    category: 'legitimate',
    baseTrustImpact: -1,
    baseAttitudeImpact: -1,
    coachMessage: 'オーバーワークで大怪我をされるよりは休養も戦術だ。しっかり体を休めて明日は集中しろよ。'
  },
  illness: {
    id: 'illness',
    label: '軽い体調不良（発熱・風邪気味）',
    category: 'legitimate',
    baseTrustImpact: 0,
    baseAttitudeImpact: 0,
    coachMessage: '体調管理も実力のうちだが、無理して来ても悪化させるだけだ。しっかり治して戻ってこい。'
  },
  injury_care: {
    id: 'injury_care',
    label: '怪我・患部の違和感（トレーナーと相談）',
    category: 'legitimate',
    baseTrustImpact: 0,
    baseAttitudeImpact: 0,
    coachMessage: '違和感を放置せず申告したのは賢明だ。アイシングとケアに専念し、無理のないペースで治せ。'
  },
  academic: {
    id: 'academic',
    label: '学校・学業（テスト勉強・補習）',
    category: 'legitimate',
    baseTrustImpact: -1,
    baseAttitudeImpact: -1,
    coachMessage: '学生としての本分も大切だ。文武両道でしっかり点数を取って、終わったらまたグラウンドで会おう。'
  },
  family: {
    id: 'family',
    label: '家族の事情（冠婚葬祭・家庭都合）',
    category: 'legitimate',
    baseTrustImpact: 0,
    baseAttitudeImpact: 0,
    coachMessage: '家庭の事情なら仕方ない。落ち着いたら元気にチームに戻っておいで。'
  },
  personal: {
    id: 'personal',
    label: '個人的な予定（外せない用事）',
    category: 'doubtful',
    baseTrustImpact: -2,
    baseAttitudeImpact: -2,
    coachMessage: '外せない用事か。あまり練習を優先順位の下に置かないように、自己管理を徹底してくれ。'
  },
  solo_practice: {
    id: 'solo_practice',
    label: '自主練習を優先（個人メニューに集中）',
    category: 'doubtful',
    baseTrustImpact: -2,
    baseAttitudeImpact: 0,
    coachMessage: '個人の課題に向き合う向上心は認める。だがサッカーはチームスポーツだ。全体練習の和も大切にしろ。'
  },
  rest_needed: {
    id: 'rest_needed',
    label: '休養が必要（オーバーワーク防止）',
    category: 'legitimate',
    baseTrustImpact: -1,
    baseAttitudeImpact: 0,
    coachMessage: '疲労をため込んでパフォーマンスを下げるよりは、計画的な休養が必要な時もあるな。'
  },
  coach_consulted: {
    id: 'coach_consulted',
    label: '監督・コーチへの相談後（事前承認済み）',
    category: 'legitimate',
    baseTrustImpact: 0,
    baseAttitudeImpact: 0,
    coachMessage: '事前に相談してくれた通りだな。手続き通り欠席を受理した。次回からまた頼むぞ。'
  },
  other: {
    id: 'other',
    label: 'その他（自由記述）',
    category: 'doubtful',
    baseTrustImpact: -2,
    baseAttitudeImpact: -2,
    coachMessage: '事情は理解した。日々の練習へのコミットメントを忘れないようにしてくれ。'
  },
  unexcused: {
    id: 'unexcused',
    label: '無断欠席（規律違反）',
    category: 'unexcused',
    baseTrustImpact: -15,
    baseAttitudeImpact: -15,
    coachMessage: '連絡もなしに練習をサボるとは何事だ！チームの和と規律を乱す行為は決して看過できない。スタメン起用も見直すぞ！'
  }
};

export interface RealProClub {
  id: string;
  name: string;
  country: string;
  countryId: string;
  level: number; // 1-5
  reputation: number; // 1-100
  tier: 'world_class' | 'top_flight' | 'challenger';
  leagueName: string;
  division: 1 | 2;
  minOvr15yo: number;
  city?: string;
}

export const REAL_PRO_CLUBS: RealProClub[] = [
  // Spain - Division 1 (La Liga)
  { id: 'barcelona', name: 'FC Barcelona', country: 'スペイン', countryId: 'spain', level: 5, reputation: 95, tier: 'world_class', leagueName: 'ラ・リーガ', division: 1, minOvr15yo: 62 },
  { id: 'real_madrid', name: 'Real Madrid', country: 'スペイン', countryId: 'spain', level: 5, reputation: 96, tier: 'world_class', leagueName: 'ラ・リーガ', division: 1, minOvr15yo: 63 },
  { id: 'atletico_madrid', name: 'Atlético Madrid', country: 'スペイン', countryId: 'spain', level: 5, reputation: 88, tier: 'top_flight', leagueName: 'ラ・リーガ', division: 1, minOvr15yo: 59 },
  { id: 'real_sociedad', name: 'Real Sociedad', country: 'スペイン', countryId: 'spain', level: 4, reputation: 82, tier: 'top_flight', leagueName: 'ラ・リーガ', division: 1, minOvr15yo: 56 },
  { id: 'athletic_club', name: 'Athletic Club', country: 'スペイン', countryId: 'spain', level: 4, reputation: 81, tier: 'top_flight', leagueName: 'ラ・リーガ', division: 1, minOvr15yo: 56 },
  { id: 'valencia', name: 'Valencia CF', country: 'スペイン', countryId: 'spain', level: 4, reputation: 79, tier: 'top_flight', leagueName: 'ラ・リーガ', division: 1, minOvr15yo: 54 },
  { id: 'sevilla', name: 'Sevilla FC', country: 'スペイン', countryId: 'spain', level: 4, reputation: 80, tier: 'top_flight', leagueName: 'ラ・リーガ', division: 1, minOvr15yo: 55 },
  { id: 'real_betis', name: 'Real Betis', country: 'スペイン', countryId: 'spain', level: 4, reputation: 79, tier: 'top_flight', leagueName: 'ラ・リーガ', division: 1, minOvr15yo: 54 },
  { id: 'villarreal', name: 'Villarreal CF', country: 'スペイン', countryId: 'spain', level: 4, reputation: 80, tier: 'top_flight', leagueName: 'ラ・リーガ', division: 1, minOvr15yo: 55 },
  { id: 'girona', name: 'Girona FC', country: 'スペイン', countryId: 'spain', level: 4, reputation: 79, tier: 'top_flight', leagueName: 'ラ・リーガ', division: 1, minOvr15yo: 54 },
  // Spain - Division 2 (Segunda División)
  { id: 'espanyol', name: 'RCD Espanyol', country: 'スペイン', countryId: 'spain', level: 3, reputation: 74, tier: 'challenger', leagueName: 'セグンダ・ディビシオン', division: 2, minOvr15yo: 50 },
  { id: 'valladolid', name: 'Real Valladolid', country: 'スペイン', countryId: 'spain', level: 3, reputation: 73, tier: 'challenger', leagueName: 'セグンダ・ディビシオン', division: 2, minOvr15yo: 49 },
  { id: 'leganes', name: 'CD Leganés', country: 'スペイン', countryId: 'spain', level: 3, reputation: 72, tier: 'challenger', leagueName: 'セグンダ・ディビシオン', division: 2, minOvr15yo: 48 },
  { id: 'sporting_gijon', name: 'Sporting Gijón', country: 'スペイン', countryId: 'spain', level: 3, reputation: 71, tier: 'challenger', leagueName: 'セグンダ・ディビシオン', division: 2, minOvr15yo: 48 },
  { id: 'oviedo', name: 'Real Oviedo', country: 'スペイン', countryId: 'spain', level: 3, reputation: 71, tier: 'challenger', leagueName: 'セグンダ・ディビシオン', division: 2, minOvr15yo: 48 },
  { id: 'levante', name: 'Levante UD', country: 'スペイン', countryId: 'spain', level: 3, reputation: 72, tier: 'challenger', leagueName: 'セグンダ・ディビシオン', division: 2, minOvr15yo: 49 },
  { id: 'racing_santander', name: 'Racing Santander', country: 'スペイン', countryId: 'spain', level: 3, reputation: 70, tier: 'challenger', leagueName: 'セグンダ・ディビシオン', division: 2, minOvr15yo: 47 },
  { id: 'zaragoza', name: 'Real Zaragoza', country: 'スペイン', countryId: 'spain', level: 3, reputation: 71, tier: 'challenger', leagueName: 'セグンダ・ディビシオン', division: 2, minOvr15yo: 48 },

  // England - Division 1 (Premier League)
  { id: 'man_city', name: 'Manchester City', country: 'イングランド', countryId: 'england', level: 5, reputation: 95, tier: 'world_class', leagueName: 'プレミアリーグ', division: 1, minOvr15yo: 63 },
  { id: 'liverpool', name: 'Liverpool', country: 'イングランド', countryId: 'england', level: 5, reputation: 94, tier: 'world_class', leagueName: 'プレミアリーグ', division: 1, minOvr15yo: 62 },
  { id: 'arsenal', name: 'Arsenal', country: 'イングランド', countryId: 'england', level: 5, reputation: 92, tier: 'world_class', leagueName: 'プレミアリーグ', division: 1, minOvr15yo: 61 },
  { id: 'chelsea', name: 'Chelsea', country: 'イングランド', countryId: 'england', level: 5, reputation: 89, tier: 'top_flight', leagueName: 'プレミアリーグ', division: 1, minOvr15yo: 60 },
  { id: 'man_united', name: 'Manchester United', country: 'イングランド', countryId: 'england', level: 5, reputation: 91, tier: 'top_flight', leagueName: 'プレミアリーグ', division: 1, minOvr15yo: 60 },
  { id: 'tottenham', name: 'Tottenham Hotspur', country: 'イングランド', countryId: 'england', level: 4, reputation: 85, tier: 'top_flight', leagueName: 'プレミアリーグ', division: 1, minOvr15yo: 58 },
  { id: 'newcastle', name: 'Newcastle United', country: 'イングランド', countryId: 'england', level: 4, reputation: 83, tier: 'top_flight', leagueName: 'プレミアリーグ', division: 1, minOvr15yo: 57 },
  { id: 'aston_villa', name: 'Aston Villa', country: 'イングランド', countryId: 'england', level: 4, reputation: 82, tier: 'top_flight', leagueName: 'プレミアリーグ', division: 1, minOvr15yo: 56 },
  { id: 'brighton', name: 'Brighton & Hove Albion', country: 'イングランド', countryId: 'england', level: 4, reputation: 80, tier: 'top_flight', leagueName: 'プレミアリーグ', division: 1, minOvr15yo: 55 },
  { id: 'west_ham', name: 'West Ham United', country: 'イングランド', countryId: 'england', level: 4, reputation: 79, tier: 'top_flight', leagueName: 'プレミアリーグ', division: 1, minOvr15yo: 54 },
  // England - Division 2 (Championship)
  { id: 'leicester', name: 'Leicester City', country: 'イングランド', countryId: 'england', level: 3, reputation: 76, tier: 'challenger', leagueName: 'チャンピオンシップ', division: 2, minOvr15yo: 51 },
  { id: 'leeds', name: 'Leeds United', country: 'イングランド', countryId: 'england', level: 3, reputation: 75, tier: 'challenger', leagueName: 'チャンピオンシップ', division: 2, minOvr15yo: 50 },
  { id: 'southampton', name: 'Southampton', country: 'イングランド', countryId: 'england', level: 3, reputation: 74, tier: 'challenger', leagueName: 'チャンピオンシップ', division: 2, minOvr15yo: 50 },
  { id: 'ipswich', name: 'Ipswich Town', country: 'イングランド', countryId: 'england', level: 3, reputation: 72, tier: 'challenger', leagueName: 'チャンピオンシップ', division: 2, minOvr15yo: 48 },
  { id: 'norwich', name: 'Norwich City', country: 'イングランド', countryId: 'england', level: 3, reputation: 72, tier: 'challenger', leagueName: 'チャンピオンシップ', division: 2, minOvr15yo: 48 },
  { id: 'west_brom', name: 'West Bromwich Albion', country: 'イングランド', countryId: 'england', level: 3, reputation: 71, tier: 'challenger', leagueName: 'チャンピオンシップ', division: 2, minOvr15yo: 48 },
  { id: 'middlesbrough', name: 'Middlesbrough', country: 'イングランド', countryId: 'england', level: 3, reputation: 71, tier: 'challenger', leagueName: 'チャンピオンシップ', division: 2, minOvr15yo: 48 },
  { id: 'coventry', name: 'Coventry City', country: 'イングランド', countryId: 'england', level: 3, reputation: 70, tier: 'challenger', leagueName: 'チャンピオンシップ', division: 2, minOvr15yo: 47 },
  { id: 'watford', name: 'Watford', country: 'イングランド', countryId: 'england', level: 3, reputation: 71, tier: 'challenger', leagueName: 'チャンピオンシップ', division: 2, minOvr15yo: 48 },

  // Germany - Division 1 (Bundesliga)
  { id: 'bayern', name: 'Bayern Munich', country: 'ドイツ', countryId: 'germany', level: 5, reputation: 94, tier: 'world_class', leagueName: 'ブンデスリーガ', division: 1, minOvr15yo: 62 },
  { id: 'dortmund', name: 'Borussia Dortmund', country: 'ドイツ', countryId: 'germany', level: 5, reputation: 90, tier: 'world_class', leagueName: 'ブンデスリーガ', division: 1, minOvr15yo: 59 },
  { id: 'leverkusen', name: 'Bayer Leverkusen', country: 'ドイツ', countryId: 'germany', level: 5, reputation: 88, tier: 'top_flight', leagueName: 'ブンデスリーガ', division: 1, minOvr15yo: 58 },
  { id: 'leipzig', name: 'RB Leipzig', country: 'ドイツ', countryId: 'germany', level: 4, reputation: 85, tier: 'top_flight', leagueName: 'ブンデスリーガ', division: 1, minOvr15yo: 57 },
  { id: 'frankfurt', name: 'Eintracht Frankfurt', country: 'ドイツ', countryId: 'germany', level: 4, reputation: 80, tier: 'top_flight', leagueName: 'ブンデスリーガ', division: 1, minOvr15yo: 55 },
  { id: 'stuttgart', name: 'VfB Stuttgart', country: 'ドイツ', countryId: 'germany', level: 4, reputation: 79, tier: 'top_flight', leagueName: 'ブンデスリーガ', division: 1, minOvr15yo: 54 },
  { id: 'freiburg', name: 'SC Freiburg', country: 'ドイツ', countryId: 'germany', level: 4, reputation: 78, tier: 'top_flight', leagueName: 'ブンデスリーガ', division: 1, minOvr15yo: 53 },
  { id: 'hoffenheim', name: 'TSG Hoffenheim', country: 'ドイツ', countryId: 'germany', level: 3, reputation: 76, tier: 'challenger', leagueName: 'ブンデスリーガ', division: 1, minOvr15yo: 51 },
  // Germany - Division 2 (2. Bundesliga)
  { id: 'hamburg', name: 'Hamburger SV', country: 'ドイツ', countryId: 'germany', level: 3, reputation: 75, tier: 'challenger', leagueName: '2. ブンデスリーガ', division: 2, minOvr15yo: 50 },
  { id: 'schalke', name: 'FC Schalke 04', country: 'ドイツ', countryId: 'germany', level: 3, reputation: 74, tier: 'challenger', leagueName: '2. ブンデスリーガ', division: 2, minOvr15yo: 49 },
  { id: 'hertha', name: 'Hertha BSC', country: 'ドイツ', countryId: 'germany', level: 3, reputation: 73, tier: 'challenger', leagueName: '2. ブンデスリーガ', division: 2, minOvr15yo: 49 },
  { id: 'hannover', name: 'Hannover 96', country: 'ドイツ', countryId: 'germany', level: 3, reputation: 72, tier: 'challenger', leagueName: '2. ブンデスリーガ', division: 2, minOvr15yo: 48 },
  { id: 'dusseldorf', name: 'Fortuna Düsseldorf', country: 'ドイツ', countryId: 'germany', level: 3, reputation: 72, tier: 'challenger', leagueName: '2. ブンデスリーガ', division: 2, minOvr15yo: 48 },
  { id: 'st_pauli', name: 'FC St. Pauli', country: 'ドイツ', countryId: 'germany', level: 3, reputation: 72, tier: 'challenger', leagueName: '2. ブンデスリーガ', division: 2, minOvr15yo: 48 },
  { id: 'nurnberg', name: '1. FC Nürnberg', country: 'ドイツ', countryId: 'germany', level: 3, reputation: 71, tier: 'challenger', leagueName: '2. ブンデスリーガ', division: 2, minOvr15yo: 48 },
  { id: 'karlsruhe', name: 'Karlsruher SC', country: 'ドイツ', countryId: 'germany', level: 3, reputation: 70, tier: 'challenger', leagueName: '2. ブンデスリーガ', division: 2, minOvr15yo: 47 },

  // France - Division 1 (Ligue 1)
  { id: 'psg', name: 'Paris Saint-Germain', country: 'フランス', countryId: 'france', level: 5, reputation: 93, tier: 'world_class', leagueName: 'リーグ・アン', division: 1, minOvr15yo: 62 },
  { id: 'monaco', name: 'AS Monaco', country: 'フランス', countryId: 'france', level: 4, reputation: 83, tier: 'top_flight', leagueName: 'リーグ・アン', division: 1, minOvr15yo: 56 },
  { id: 'marseille', name: 'Olympique de Marseille', country: 'フランス', countryId: 'france', level: 4, reputation: 82, tier: 'top_flight', leagueName: 'リーグ・アン', division: 1, minOvr15yo: 56 },
  { id: 'lyon', name: 'Olympique Lyonnais', country: 'フランス', countryId: 'france', level: 4, reputation: 81, tier: 'top_flight', leagueName: 'リーグ・アン', division: 1, minOvr15yo: 55 },
  { id: 'lille', name: 'Lille OSC', country: 'フランス', countryId: 'france', level: 4, reputation: 80, tier: 'top_flight', leagueName: 'リーグ・アン', division: 1, minOvr15yo: 54 },
  { id: 'rennes', name: 'Stade Rennais', country: 'フランス', countryId: 'france', level: 4, reputation: 79, tier: 'top_flight', leagueName: 'リーグ・アン', division: 1, minOvr15yo: 53 },
  { id: 'nice', name: 'OGC Nice', country: 'フランス', countryId: 'france', level: 4, reputation: 79, tier: 'top_flight', leagueName: 'リーグ・アン', division: 1, minOvr15yo: 53 },
  { id: 'lens', name: 'RC Lens', country: 'フランス', countryId: 'france', level: 4, reputation: 78, tier: 'top_flight', leagueName: 'リーグ・アン', division: 1, minOvr15yo: 53 },
  // France - Division 2 (Ligue 2)
  { id: 'auxerre', name: 'AJ Auxerre', country: 'フランス', countryId: 'france', level: 3, reputation: 73, tier: 'challenger', leagueName: 'リーグ・ドゥ', division: 2, minOvr15yo: 49 },
  { id: 'angers', name: 'Angers SCO', country: 'フランス', countryId: 'france', level: 3, reputation: 72, tier: 'challenger', leagueName: 'リーグ・ドゥ', division: 2, minOvr15yo: 48 },
  { id: 'saint_etienne', name: 'AS Saint-Étienne', country: 'フランス', countryId: 'france', level: 3, reputation: 74, tier: 'challenger', leagueName: 'リーグ・ドゥ', division: 2, minOvr15yo: 50 },
  { id: 'metz', name: 'FC Metz', country: 'フランス', countryId: 'france', level: 3, reputation: 72, tier: 'challenger', leagueName: 'リーグ・ドゥ', division: 2, minOvr15yo: 48 },
  { id: 'bordeaux', name: 'Girondins de Bordeaux', country: 'フランス', countryId: 'france', level: 3, reputation: 73, tier: 'challenger', leagueName: 'リーグ・ドゥ', division: 2, minOvr15yo: 49 },
  { id: 'caen', name: 'SM Caen', country: 'フランス', countryId: 'france', level: 3, reputation: 71, tier: 'challenger', leagueName: 'リーグ・ドゥ', division: 2, minOvr15yo: 48 },
  { id: 'guingamp', name: 'EA Guingamp', country: 'フランス', countryId: 'france', level: 3, reputation: 70, tier: 'challenger', leagueName: 'リーグ・ドゥ', division: 2, minOvr15yo: 47 },
  { id: 'grenoble', name: 'Grenoble Foot 38', country: 'フランス', countryId: 'france', level: 3, reputation: 70, tier: 'challenger', leagueName: 'リーグ・ドゥ', division: 2, minOvr15yo: 47 },

  // Italy - Division 1 (Serie A)
  { id: 'inter', name: 'Inter', country: 'イタリア', countryId: 'italy', level: 5, reputation: 92, tier: 'world_class', leagueName: 'セリエA', division: 1, minOvr15yo: 61 },
  { id: 'ac_milan', name: 'AC Milan', country: 'イタリア', countryId: 'italy', level: 5, reputation: 91, tier: 'world_class', leagueName: 'セリエA', division: 1, minOvr15yo: 61 },
  { id: 'juventus', name: 'Juventus', country: 'イタリア', countryId: 'italy', level: 5, reputation: 91, tier: 'world_class', leagueName: 'セリエA', division: 1, minOvr15yo: 61 },
  { id: 'napoli', name: 'Napoli', country: 'イタリア', countryId: 'italy', level: 4, reputation: 85, tier: 'top_flight', leagueName: 'セリエA', division: 1, minOvr15yo: 58 },
  { id: 'roma', name: 'AS Roma', country: 'イタリア', countryId: 'italy', level: 4, reputation: 83, tier: 'top_flight', leagueName: 'セリエA', division: 1, minOvr15yo: 56 },
  { id: 'atalanta', name: 'Atalanta', country: 'イタリア', countryId: 'italy', level: 4, reputation: 82, tier: 'top_flight', leagueName: 'セリエA', division: 1, minOvr15yo: 56 },
  { id: 'lazio', name: 'SS Lazio', country: 'イタリア', countryId: 'italy', level: 4, reputation: 81, tier: 'top_flight', leagueName: 'セリエA', division: 1, minOvr15yo: 55 },
  { id: 'fiorentina', name: 'ACF Fiorentina', country: 'イタリア', countryId: 'italy', level: 4, reputation: 80, tier: 'top_flight', leagueName: 'セリエA', division: 1, minOvr15yo: 54 },
  { id: 'bologna', name: 'Bologna FC', country: 'イタリア', countryId: 'italy', level: 4, reputation: 79, tier: 'top_flight', leagueName: 'セリエA', division: 1, minOvr15yo: 53 },
  { id: 'torino', name: 'Torino FC', country: 'イタリア', countryId: 'italy', level: 3, reputation: 77, tier: 'challenger', leagueName: 'セリエA', division: 1, minOvr15yo: 52 },
  // Italy - Division 2 (Serie B)
  { id: 'parma', name: 'Parma Calcio', country: 'イタリア', countryId: 'italy', level: 3, reputation: 74, tier: 'challenger', leagueName: 'セリエB', division: 2, minOvr15yo: 50 },
  { id: 'como', name: 'Como 1907', country: 'イタリア', countryId: 'italy', level: 3, reputation: 73, tier: 'challenger', leagueName: 'セリエB', division: 2, minOvr15yo: 49 },
  { id: 'venezia', name: 'Venezia FC', country: 'イタリア', countryId: 'italy', level: 3, reputation: 72, tier: 'challenger', leagueName: 'セリエB', division: 2, minOvr15yo: 48 },
  { id: 'sampdoria', name: 'UC Sampdoria', country: 'イタリア', countryId: 'italy', level: 3, reputation: 74, tier: 'challenger', leagueName: 'セリエB', division: 2, minOvr15yo: 50 },
  { id: 'palermo', name: 'Palermo FC', country: 'イタリア', countryId: 'italy', level: 3, reputation: 73, tier: 'challenger', leagueName: 'セリエB', division: 2, minOvr15yo: 49 },
  { id: 'cremonese', name: 'US Cremonese', country: 'イタリア', countryId: 'italy', level: 3, reputation: 72, tier: 'challenger', leagueName: 'セリエB', division: 2, minOvr15yo: 48 },
  { id: 'bari', name: 'SSC Bari', country: 'イタリア', countryId: 'italy', level: 3, reputation: 71, tier: 'challenger', leagueName: 'セリエB', division: 2, minOvr15yo: 48 },
  { id: 'brescia', name: 'Brescia Calcio', country: 'イタリア', countryId: 'italy', level: 3, reputation: 71, tier: 'challenger', leagueName: 'セリエB', division: 2, minOvr15yo: 48 },

  // Japan - Division 1 (J1 League)
  { id: 'vissel_kobe', name: 'ヴィッセル神戸', country: '日本', countryId: 'japan', level: 4, reputation: 78, tier: 'top_flight', leagueName: 'J1リーグ', division: 1, minOvr15yo: 52 },
  { id: 'kawasaki_frontale', name: '川崎フロンターレ', country: '日本', countryId: 'japan', level: 4, reputation: 77, tier: 'top_flight', leagueName: 'J1リーグ', division: 1, minOvr15yo: 51 },
  { id: 'yokohama_f_marinos', name: '横浜F・マリノス', country: '日本', countryId: 'japan', level: 4, reputation: 77, tier: 'top_flight', leagueName: 'J1リーグ', division: 1, minOvr15yo: 51 },
  { id: 'urawa_reds', name: '浦和レッズ', country: '日本', countryId: 'japan', level: 4, reputation: 78, tier: 'top_flight', leagueName: 'J1リーグ', division: 1, minOvr15yo: 52 },
  { id: 'sanfrecce_hiroshima', name: 'サンフレッチェ広島', country: '日本', countryId: 'japan', level: 4, reputation: 76, tier: 'top_flight', leagueName: 'J1リーグ', division: 1, minOvr15yo: 51 },
  { id: 'kashima_antlers', name: '鹿島アントラーズ', country: '日本', countryId: 'japan', level: 4, reputation: 77, tier: 'top_flight', leagueName: 'J1リーグ', division: 1, minOvr15yo: 51 },
  { id: 'gamba_osaka', name: 'ガンバ大阪', country: '日本', countryId: 'japan', level: 3, reputation: 73, tier: 'challenger', leagueName: 'J1リーグ', division: 1, minOvr15yo: 49 },
  { id: 'cerezo_osaka', name: 'セレッソ大阪', country: '日本', countryId: 'japan', level: 3, reputation: 73, tier: 'challenger', leagueName: 'J1リーグ', division: 1, minOvr15yo: 49 },
  { id: 'fc_tokyo', name: 'FC東京', country: '日本', countryId: 'japan', level: 3, reputation: 73, tier: 'challenger', leagueName: 'J1リーグ', division: 1, minOvr15yo: 49 },
  { id: 'nagoya_grampus', name: '名古屋グランパス', country: '日本', countryId: 'japan', level: 3, reputation: 74, tier: 'challenger', leagueName: 'J1リーグ', division: 1, minOvr15yo: 50 },
  { id: 'machida_zelvia', name: '町田ゼルビア', country: '日本', countryId: 'japan', level: 3, reputation: 72, tier: 'challenger', leagueName: 'J1リーグ', division: 1, minOvr15yo: 48 },
  { id: 'avispa_fukuoka', name: 'アビスパ福岡', country: '日本', countryId: 'japan', level: 3, reputation: 71, tier: 'challenger', leagueName: 'J1リーグ', division: 1, minOvr15yo: 48 },
  // Japan - Division 2 (J2 League)
  { id: 'shimizu_spulse', name: '清水エスパルス', country: '日本', countryId: 'japan', level: 3, reputation: 73, tier: 'challenger', leagueName: 'J2リーグ', division: 2, minOvr15yo: 49 },
  { id: 'yokohama_fc', name: '横浜FC', country: '日本', countryId: 'japan', level: 3, reputation: 72, tier: 'challenger', leagueName: 'J2リーグ', division: 2, minOvr15yo: 48 },
  { id: 'v_varen_nagasaki', name: 'V・ファーレン長崎', country: '日本', countryId: 'japan', level: 3, reputation: 72, tier: 'challenger', leagueName: 'J2リーグ', division: 2, minOvr15yo: 48 },
  { id: 'montedio_yamagata', name: 'モンテディオ山形', country: '日本', countryId: 'japan', level: 3, reputation: 71, tier: 'challenger', leagueName: 'J2リーグ', division: 2, minOvr15yo: 47 },
  { id: 'jef_chiba', name: 'ジェフユナイテッド千葉', country: '日本', countryId: 'japan', level: 3, reputation: 72, tier: 'challenger', leagueName: 'J2リーグ', division: 2, minOvr15yo: 48 },
  { id: 'vegalta_sendai', name: 'ベガルタ仙台', country: '日本', countryId: 'japan', level: 3, reputation: 72, tier: 'challenger', leagueName: 'J2リーグ', division: 2, minOvr15yo: 48 },
  { id: 'fagiano_okayama', name: 'ファジアーノ岡山', country: '日本', countryId: 'japan', level: 3, reputation: 70, tier: 'challenger', leagueName: 'J2リーグ', division: 2, minOvr15yo: 47 },
  { id: 'oita_trinita', name: '大分トリニータ', country: '日本', countryId: 'japan', level: 3, reputation: 71, tier: 'challenger', leagueName: 'J2リーグ', division: 2, minOvr15yo: 47 },
  { id: 'ventforet_kofu', name: 'ヴァンフォーレ甲府', country: '日本', countryId: 'japan', level: 3, reputation: 71, tier: 'challenger', leagueName: 'J2リーグ', division: 2, minOvr15yo: 47 },
  { id: 'tokushima_vortis', name: '徳島ヴォルティス', country: '日本', countryId: 'japan', level: 3, reputation: 70, tier: 'challenger', leagueName: 'J2リーグ', division: 2, minOvr15yo: 46 }
];

export function getClubHomeBase(clubOrSchoolName: string): string {
  if (!clubOrSchoolName) return '東京 (日本)';
  const n = clubOrSchoolName.toLowerCase();
  
  // Real Pro Clubs
  if (n.includes('chelsea') || n.includes('arsenal') || n.includes('tottenham') || n.includes('west ham')) return 'ロンドン (イングランド)';
  if (n.includes('manchester city') || n.includes('manchester united') || n.includes('man city') || n.includes('man united')) return 'マンチェスター (イングランド)';
  if (n.includes('liverpool')) return 'リバプール (イングランド)';
  if (n.includes('newcastle')) return 'ニューカッスル (イングランド)';
  if (n.includes('brighton')) return 'ブライトン (イングランド)';
  if (n.includes('aston villa') || n.includes('birmingham')) return 'バーミンガム (イングランド)';
  
  if (n.includes('real madrid') || n.includes('atlético') || n.includes('atletico') || n.includes('leganés') || n.includes('rayo')) return 'マドリード (スペイン)';
  if (n.includes('barcelona') || n.includes('espanyol')) return 'バルセロナ (スペイン)';
  if (n.includes('real sociedad') || n.includes('san sebastian')) return 'サン・セバスティアン (スペイン)';
  if (n.includes('athletic') || n.includes('bilbao')) return 'ビルバオ (スペイン)';
  if (n.includes('sevilla') || n.includes('betis')) return 'セビージャ (スペイン)';
  if (n.includes('valencia') || n.includes('villarreal')) return 'バレンシア (スペイン)';

  if (n.includes('bayern') || n.includes('munich')) return 'ミュンヘン (ドイツ)';
  if (n.includes('dortmund')) return 'ドルトムント (ドイツ)';
  if (n.includes('leverkusen')) return 'レバークーゼン (ドイツ)';
  if (n.includes('leipzig')) return 'ライプツィヒ (ドイツ)';
  if (n.includes('frankfurt')) return 'フランクフルト (ドイツ)';

  if (n.includes('paris') || n.includes('psg')) return 'パリ (フランス)';
  if (n.includes('marseille')) return 'マルセイユ (フランス)';
  if (n.includes('lyon')) return 'リヨン (フランス)';
  if (n.includes('monaco')) return 'モナコ (フランス)';

  if (n.includes('inter') || n.includes('milan')) return 'ミラノ (イタリア)';
  if (n.includes('juventus') || n.includes('torino')) return 'トリノ (イタリア)';
  if (n.includes('roma') || n.includes('lazio')) return 'ローマ (イタリア)';
  if (n.includes('napoli')) return 'ナポリ (イタリア)';

  // Japanese J-Clubs
  if (n.includes('神戸')) return '神戸 (日本)';
  if (n.includes('川崎')) return '川崎 (日本)';
  if (n.includes('横浜')) return '横浜 (日本)';
  if (n.includes('浦和') || n.includes('大宮')) return 'さいたま (日本)';
  if (n.includes('鹿島')) return '鹿島 (日本)';
  if (n.includes('広島')) return '広島 (日本)';
  if (n.includes('ガンバ') || n.includes('セレッソ') || n.includes('大阪')) return '大阪 (日本)';
  if (n.includes('名古屋')) return '名古屋 (日本)';
  if (n.includes('東京') || n.includes('町田')) return '東京 (日本)';
  if (n.includes('福岡')) return '福岡 (日本)';
  if (n.includes('清水') || n.includes('磐田')) return '静岡 (日本)';
  if (n.includes('仙台')) return '仙台 (日本)';
  if (n.includes('札幌')) return '札幌 (日本)';

  // High Schools
  if (n.includes('青森山田')) return '青森 (日本)';
  if (n.includes('市立船橋') || n.includes('流経大柏')) return '千葉 (日本)';
  if (n.includes('東福岡')) return '福岡 (日本)';
  if (n.includes('静学') || n.includes('静岡学園')) return '静岡 (日本)';
  if (n.includes('帝京長岡')) return '新潟 (日本)';
  if (n.includes('桐光学園') || n.includes('桐蔭学園')) return '神奈川 (日本)';
  if (n.includes('米子北')) return '鳥取 (日本)';
  if (n.includes('大津')) return '熊本 (日本)';
  if (n.includes('昌平')) return '埼玉 (日本)';
  if (n.includes('神村学園')) return '鹿児島 (日本)';
  if (n.includes('尚志')) return '福島 (日本)';
  if (n.includes('前橋育英')) return '群馬 (日本)';

  return '東京 (日本)';
}

/**
 * Realistic High School & U-18 Youth Teams
 * High school players strictly play only against these clubs.
 */
export const HIGH_SCHOOL_TEAMS: string[] = [
  '青森山田高校',
  '市立船橋高校',
  '東福岡高校',
  '静岡学園高校',
  '帝京長岡高校',
  '桐光学園高校',
  '米子北高校',
  '大津高校',
  '昌平高校',
  '神村学園高校',
  '尚志高校',
  '前橋育英高校',
  '流通経済大柏高校',
  '富山第一高校',
  '矢板中央高校',
  '履正社高校'
];

export const U18_YOUTH_ACADEMIES: string[] = [
  '川崎フロンターレU-18',
  'FC東京U-18',
  '横浜F・マリノスユース',
  '浦和レッズユース',
  'ヴィッセル神戸U-18',
  'サンフレッチェ広島ユース',
  '柏レイソルU-18',
  '清水エスパルスユース'
];

/**
 * Middle School & U-15 Teams
 */
export const MIDDLE_SCHOOL_TEAMS: string[] = [
  '青森山田中サッカー部',
  '南陽中学校サッカー部',
  '桜ヶ丘中学校サッカー部',
  '青葉中学校サッカー部',
  '川崎フロンターレU-15',
  'FC東京U-15むさし',
  '横浜F・マリノスジュニアユース',
  '浦和レッズジュニアユース',
  'ガンバ大阪ジュニアユース',
  'セレッソ大阪U-15'
];

/**
 * Elementary & U-12 Teams
 */
export const ELEMENTARY_TEAMS: string[] = [
  '南が丘FCジュニア',
  '桜ヶ丘SC',
  '東京ヴェルディジュニア',
  '川崎フロンターレU-12',
  '横浜F・マリノスプライマリー',
  '浦和レッズジュニア',
  '江南南SS',
  '新座片山FC少年団'
];

/**
 * Official In-Game Shop Items
 */
import { ShopItem } from '../types/footballLife';

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'spikes_speed_pro',
    name: 'プロ仕様軽量スピードスパイク',
    category: 'cleats',
    price: 32000,
    description: '最新の超軽量カーボンプレートを採用したトッププロ御用達のサッカースパイク。',
    effectDescription: '装備中：ペース +2、ドリブル +1',
    statBonus: { pace: 2, dribbling: 1 }
  },
  {
    id: 'spikes_control_elite',
    name: '精密コントロールスパイク',
    category: 'cleats',
    price: 28000,
    description: 'ボールの吸い付きと繊細なタッチを極限まで高めたカンガルーレザー仕様。',
    effectDescription: '装備中：パス +2、戦術眼 +1',
    statBonus: { passing: 2, tacticalSense: 1 }
  },
  {
    id: 'spikes_power_strike',
    name: 'パワーストライカースパイク',
    category: 'cleats',
    price: 30000,
    description: '強烈なインパクトとブレ球を生み出すパワー系ストライカー専用スパイク。',
    effectDescription: '装備中：シュート +2、フィジカル +1',
    statBonus: { shooting: 2, physical: 1 }
  },
  {
    id: 'spikes_defense_solid',
    name: '高耐久スタッドディフェンススパイク',
    category: 'cleats',
    price: 26000,
    description: '激しい球際でのスライディングや踏ん張りを支える高剛性アウトソール搭載。',
    effectDescription: '装備中：守備 +2、フィジカル +1',
    statBonus: { defending: 2, physical: 1 }
  },
  {
    id: 'nutrition_amino_pack',
    name: '高濃度アミノ酸サプリメント',
    category: 'nutrition',
    price: 5000,
    description: '筋肉の分解を防ぎ、日々のハードトレーニング後の回復を劇的に促進する。',
    effectDescription: '購入時：疲労 -15 回復',
    fatigueRecovery: 15
  },
  {
    id: 'recovery_compression_wear',
    name: '疲労回復コンプレッションスーツ',
    category: 'recovery',
    price: 18000,
    description: '睡眠時の血流を促進し、翌朝の疲労感を大幅に軽減するリカバリーウェア。',
    effectDescription: '購入時：疲労 -25 回復 & 調子良好化',
    fatigueRecovery: 25,
    conditionBonus: true
  },
  {
    id: 'tactical_analysis_tablet',
    name: 'プロ用戦術分析タブレット',
    category: 'lifestyle',
    price: 65000,
    description: '各国のトップリーグや自チームの試合映像を高度分析できる専用端末。',
    effectDescription: '購入時：戦術眼経験値 +50',
    minAge: 13
  }
];

export function findRealProClubByName(name: string): RealProClub | undefined {
  if (!name) return undefined;
  return REAL_PRO_CLUBS.find(c => name.includes(c.name) || c.name.includes(name));
}

export function getProClubsForCountry(countryId: string, division: 1 | 2 = 1): RealProClub[] {
  const clubs = REAL_PRO_CLUBS.filter(c => c.countryId === countryId && c.division === division);
  if (clubs.length > 0) return clubs;
  const anyCountryClubs = REAL_PRO_CLUBS.filter(c => c.countryId === countryId);
  if (anyCountryClubs.length > 0) return anyCountryClubs;
  return REAL_PRO_CLUBS.filter(c => c.division === division);
}

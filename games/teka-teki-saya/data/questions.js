// Teka Teki Saya final bank (40 Hitungan + 15 Teori), OLFACTION 2026.
// Hitungan: multiple choice A to D. Teori: true (T) or false (F). Images live in assets/tts/<id>.PNG.
export const HITUNGAN = [
  {
    "id": "H01",
    "image": "H01.PNG",
    "text": "Andi ikut 2 ujian. Ujian 1: mean 75, simpangan baku 5, nilai Andi 85. Ujian 2: mean 60, simpangan baku 8, nilai Andi 68. Berapa selisih $z_1 - z_2$ (z-score Ujian 1 dikurangi z-score Ujian 2)?",
    "choices": {
      "A": "0",
      "B": "1",
      "C": "2",
      "D": "3"
    },
    "key": "B",
    "explanation": "z1=(85-75)/5=2, z2=(68-60)/8=1, selisih=2-1=1."
  },
  {
    "id": "H02",
    "image": "H02.PNG",
    "text": "Kelas A (20 siswa) rata-rata nilainya 70. Kelas B (20 siswa) rata-rata nilainya 80. Kelas C (10 siswa) rata-rata nilainya 90. Berapa rata-rata gabungan ketiga kelas?",
    "choices": {
      "A": "76",
      "B": "77",
      "C": "78",
      "D": "79"
    },
    "key": "C",
    "explanation": "(20×70+20×80+10×90)/50 = (1400+1600+900)/50 = 3900/50 = 78."
  },
  {
    "id": "H03",
    "image": "H03.PNG",
    "text": "Data nilai ulangan: 7, 5, 9, 3, 6, 5, 8, 5, 9. Berapa hasil dari (median + modus) data tersebut?",
    "choices": {
      "A": "10",
      "B": "11",
      "C": "12",
      "D": "13"
    },
    "key": "B",
    "explanation": "urut: 3,5,5,5,6,7,8,9,9 → median=6, modus=5 (muncul 3×) → 6+5=11."
  },
  {
    "id": "H04",
    "image": "H04.PNG",
    "text": "Data: 70, 60, 78, 65, 87, 70, 67. Berapa hasil dari $Q_1 + Q_3$ pada data tersebut?",
    "choices": {
      "A": "135",
      "B": "143",
      "C": "148",
      "D": "152"
    },
    "key": "B",
    "explanation": "urut dulu: 60,65,67,70,70,78,87. Q1 posisi (n+1)/4=2 → 65. Q3 posisi 3(n+1)/4=6 → 78. 65+78=143."
  },
  {
    "id": "H05",
    "image": "H05.PNG",
    "text": "Data: 14, 7, 20, 3, 11, 9, 17, 5, 12, 8, 19, 6. Berapa hasil dari $2 \\times \\text{median}$ data tersebut?",
    "choices": {
      "A": "18",
      "B": "19",
      "C": "20",
      "D": "21"
    },
    "key": "C",
    "explanation": "urut: 3,5,6,7,8,9,11,12,14,17,19,20 (n=12) → median = (9+11)/2 = 10. 10×2=20."
  },
  {
    "id": "H06",
    "image": "H06.PNG",
    "text": "Hitunglah simpangan baku dari 6, 7, 8, 9, 10.",
    "choices": {
      "A": "$\\sqrt{5}$",
      "B": "$\\sqrt{3}$",
      "C": "$\\sqrt{7}$",
      "D": "$\\sqrt{2}$"
    },
    "key": "D",
    "explanation": ""
  },
  {
    "id": "H07",
    "image": "H07.PNG",
    "text": "Data: 18, 9, 27, 14, 22, 7, 30, 16, 5. Berapa hasil dari (desil ke-7) − (desil ke-3) dari data tersebut?",
    "choices": {
      "A": "11",
      "B": "12",
      "C": "13",
      "D": "14"
    },
    "key": "C",
    "explanation": "urut: 5,7,9,14,16,18,22,27,30 (n=9). Desil-3 posisi 3 → 9. Desil-7 posisi 7 → 22. 22−9=13."
  },
  {
    "id": "H08",
    "image": "H08.PNG",
    "text": "Data: 45, 12, 38, 27, 19, 33, 8, 41, 23, 16, 29. Berapa hasil dari (persentil ke-75) − (persentil ke-25) dari data tersebut?",
    "choices": {
      "A": "20",
      "B": "21",
      "C": "22",
      "D": "23"
    },
    "key": "C",
    "explanation": "urut: 8,12,16,19,23,27,29,33,38,41,45 (n=11). P25 posisi 3 → 16. P75 posisi 9 → 38. 38−16=22."
  },
  {
    "id": "H09",
    "image": "H09.PNG",
    "text": "Data: 6, 2, 9, 4, 7, 3, 8, 5, 1, 9, 6, 3, 8, 2, 7. Hasil dari $n \\times \\text{jangkauan}$?",
    "choices": {
      "A": "100",
      "B": "110",
      "C": "120",
      "D": "130"
    },
    "key": "C",
    "explanation": "n=15, jangkauan=9-1=8, 15×8=120."
  },
  {
    "id": "H10",
    "image": "H10.PNG",
    "text": "Sebuah kotak berisi 5 bola merah dan 3 bola hijau. Diambil 2 bola sekaligus secara acak. Berapa peluang kedua bola yang terambil berwarna sama?",
    "choices": {
      "A": "$\\frac{11}{28}$",
      "B": "$\\frac{13}{28}$",
      "C": "$\\frac{15}{28}$",
      "D": "$\\frac{17}{28}$"
    },
    "key": "B",
    "explanation": "(C(5,2)+C(3,2))/C(8,2) = (10+3)/28 = 13/28."
  },
  {
    "id": "H11",
    "image": "H11.PNG",
    "text": "Sebuah kotak berisi 6 bola putih, 4 bola biru, dan 3 bola merah. Banyak cara mengambil 2 bola putih, 1 bola biru, dan 1 bola merah sekaligus adalah?",
    "choices": {
      "A": "120",
      "B": "150",
      "C": "180",
      "D": "210"
    },
    "key": "C",
    "explanation": "C(6,2)×C(4,1)×C(3,1) = 15×4×3 = 180."
  },
  {
    "id": "H12",
    "image": "H12.PNG",
    "text": "Peluang terjadinya hujan pada suatu hari adalah $\\frac{3}{10}$. Dalam periode 40 hari, berapa frekuensi harapan hari TIDAK hujan?",
    "choices": {
      "A": "24",
      "B": "26",
      "C": "28",
      "D": "30"
    },
    "key": "C",
    "explanation": "P(tidak hujan)=7/10, 7/10×40=28."
  },
  {
    "id": "H13",
    "image": "H13.PNG",
    "text": "Hasil dari $\\dfrac{8!-7!}{7!}\\times\\dfrac{5!}{4!}$?",
    "choices": {
      "A": "30",
      "B": "35",
      "C": "40",
      "D": "45"
    },
    "key": "B",
    "explanation": "8!-7!=7!(8-1)=7!×7, dibagi 7! hasil 7. 5!/4!=5. 7×5=35."
  },
  {
    "id": "H14",
    "image": "H14.PNG",
    "text": "6 orang, termasuk pasangan Andi-Budi dan pasangan Citra-Deni, duduk berjajar. Jika Andi harus bersebelahan dengan Budi, DAN Citra harus bersebelahan dengan Deni, berapa banyak susunan duduk yang mungkin?",
    "choices": {
      "A": "48",
      "B": "72",
      "C": "96",
      "D": "120"
    },
    "key": "C",
    "explanation": "anggap Andi-Budi 1 unit dan Citra-Deni 1 unit: total 4 unit berjajar = 4!=24, dikali susunan internal tiap pasangan (2!×2!=4) = 24×4=96."
  },
  {
    "id": "H15",
    "image": "H15.PNG",
    "text": "Dari semua kata yang dapat disusun dari huruf-huruf pada kata \"RAGAM\", berapa banyak susunan yang membuat kedua huruf A TIDAK bersebelahan?",
    "choices": {
      "A": "30",
      "B": "33",
      "C": "36",
      "D": "39"
    },
    "key": "C",
    "explanation": "total susunan huruf RAGAM = 5!/2!=60. Susunan dengan AA bersebelahan (1 blok + R,G,M) = 4!=24. Yang tidak bersebelahan = 60−24=36."
  },
  {
    "id": "H16",
    "image": "H16.PNG",
    "text": "8 orang, termasuk pasangan Anton-Bella dan pasangan Candra-Dewi, duduk mengelilingi meja bundar. Jika Anton harus bersebelahan dengan Bella, DAN Candra harus bersebelahan dengan Dewi, berapa banyak susunan duduk yang mungkin?",
    "choices": {
      "A": "240",
      "B": "360",
      "C": "480",
      "D": "600"
    },
    "key": "C",
    "explanation": "anggap Anton-Bella 1 unit dan Candra-Dewi 1 unit: total 6 unit melingkar = (6-1)!=120, dikali susunan internal tiap pasangan (2!×2!=4) = 120×4=480."
  },
  {
    "id": "H17",
    "image": "H17.PNG",
    "text": "Dari 12 calon pengurus OSIS (7 laki-laki, 5 perempuan), akan dipilih ketua, wakil ketua, dan bendahara. Syaratnya ketua dan wakil ketua harus berbeda jenis kelamin (bendahara bebas, asal bukan orang yang sama dengan ketua/wakil). Berapa banyak cara memilih?",
    "choices": {
      "A": "560",
      "B": "630",
      "C": "700",
      "D": "770"
    },
    "key": "C",
    "explanation": "(ketua laki, wakil perempuan) 7×5=35, ditambah (ketua perempuan, wakil laki) 5×7=35, total 70. Bendahara dipilih dari sisa 10 orang = 70×10=700."
  },
  {
    "id": "H18",
    "image": "H18.PNG",
    "text": "Data A memiliki mean 40 dan simpangan baku 8. Data B memiliki mean 60 dan simpangan baku 9. Berapa selisih koefisien variasi (CV) data A dan data B (dalam persen)?",
    "choices": {
      "A": "3%",
      "B": "5%",
      "C": "7%",
      "D": "10%"
    },
    "key": "B",
    "explanation": "CV_A=(8/40)×100%=20%, CV_B=(9/60)×100%=15%, selisih=5%."
  },
  {
    "id": "H19",
    "image": "H19.PNG",
    "text": "Hasil dari $\\dfrac{2^5 \\times 3^3}{6^3} - \\dfrac{3^4 \\times 2^2}{6^2}$?",
    "choices": {
      "A": "$-5$",
      "B": "$5$",
      "C": "$-9$",
      "D": "$9$"
    },
    "key": "A",
    "explanation": "suku 1=4, suku 2=9, 4-9=-5."
  },
  {
    "id": "H20",
    "image": "H20.PNG",
    "text": "Hasil dari $\\dfrac{5^3 \\times 2^2}{10^2} - \\dfrac{2^3 \\times 3^2}{6^2}$?",
    "choices": {
      "A": "$2$",
      "B": "$3$",
      "C": "$4$",
      "D": "$5$"
    },
    "key": "B",
    "explanation": "suku 1=5, suku 2=2, 5-2=3."
  },
  {
    "id": "H21",
    "image": "H21.PNG",
    "text": "Jika $\\log_3 5 = a$, maka nilai dari $\\log_3 45$ dalam bentuk $a$ adalah?",
    "choices": {
      "A": "$a+1$",
      "B": "$a+2$",
      "C": "$2a$",
      "D": "$3a$"
    },
    "key": "B",
    "explanation": ""
  },
  {
    "id": "H22",
    "image": "H22.PNG",
    "text": "Jika $x_1$ dan $x_2$ adalah akar-akar dari $x^2-6x+4=0$, berapakah nilai dari $\\dfrac{1}{x_1}+\\dfrac{1}{x_2}$?",
    "choices": {
      "A": "$\\frac{2}{3}$",
      "B": "$2$",
      "C": "$\\frac{3}{2}$",
      "D": "$3$"
    },
    "key": "C",
    "explanation": ""
  },
  {
    "id": "H23",
    "image": "H23.PNG",
    "text": "Berapakah nilai dari $\\sin 150° + \\cos 120°$?",
    "choices": {
      "A": "$1$",
      "B": "$0$",
      "C": "$\\frac{1}{2}$",
      "D": "$-1$"
    },
    "key": "B",
    "explanation": ""
  },
  {
    "id": "H24",
    "image": "H24.PNG",
    "text": "Himpunan penyelesaian dari pertidaksamaan $|2x-1|<5$?",
    "choices": {
      "A": "$-2<x<3$",
      "B": "$-3<x<2$",
      "C": "$x<-2$ atau $x>3$",
      "D": "$-2\\le x\\le3$"
    },
    "key": "A",
    "explanation": ""
  },
  {
    "id": "H25",
    "image": "H25.PNG",
    "text": "Diketahui matriks $A=\\begin{pmatrix}5&3\\\\2&2\\end{pmatrix}$, berapakah nilai $\\det(2A)$?",
    "choices": {
      "A": "$8$",
      "B": "$12$",
      "C": "$16$",
      "D": "$20$"
    },
    "key": "C",
    "explanation": "det(A)=4, det(2A)=2²×4=16."
  },
  {
    "id": "H26",
    "image": "H26.PNG",
    "text": "Titik $P(3,-2)$ ditranslasikan oleh $T=(1,4)$ kemudian dicerminkan terhadap garis $y=x$. Koordinat bayangan akhir titik $P$ adalah?",
    "choices": {
      "A": "$(2,4)$",
      "B": "$(-2,4)$",
      "C": "$(4,2)$",
      "D": "$(4,-2)$"
    },
    "key": "A",
    "explanation": ""
  },
  {
    "id": "H27",
    "image": "H27.PNG",
    "text": "Diketahui deret geometri tak hingga dengan suku pertama $a=18$ dan rasio $r=\\frac{1}{3}$. Berapa jumlah deret tersebut?",
    "choices": {
      "A": "24",
      "B": "27",
      "C": "30",
      "D": "36"
    },
    "key": "B",
    "explanation": "S∞=18/(2/3)=27."
  },
  {
    "id": "H28",
    "image": "H28.PNG",
    "text": "Jika $f(x)=2x+3$ dan $g(x)=x^2-1$, jumlah semua nilai $x$ yang memenuhi $(g\\circ f)(x)=0$ adalah?",
    "choices": {
      "A": "$-3$",
      "B": "$-1$",
      "C": "$1$",
      "D": "$3$"
    },
    "key": "A",
    "explanation": "(2x+3)²-1=0 ⟹ x=-1 atau x=-2, jumlah=-3."
  },
  {
    "id": "H29",
    "image": "H29.PNG",
    "text": "Diketahui $f(x)=\\dfrac{3x-1}{x+2}$, berapakah nilai $f^{-1}(2)$?",
    "choices": {
      "A": "$3$",
      "B": "$4$",
      "C": "$5$",
      "D": "$6$"
    },
    "key": "C",
    "explanation": ""
  },
  {
    "id": "H30",
    "image": "H30.PNG",
    "text": "Sisa pembagian $P(x)=x^3-2x^2+4x-5$ oleh $(x^2-x-2)$ berbentuk $ax+b$. Berapakah nilai $a+b$?",
    "choices": {
      "A": "$-2$",
      "B": "$-1$",
      "C": "$0$",
      "D": "$1$"
    },
    "key": "A",
    "explanation": "a=5, b=-7, a+b=-2."
  },
  {
    "id": "H31",
    "image": "H31.PNG",
    "text": "Diketahui vektor $\\vec{u}=(6,8,10)$. Berapakah panjang vektor $\\vec{u}$?",
    "choices": {
      "A": "$10\\sqrt{2}$",
      "B": "$10\\sqrt{3}$",
      "C": "$20$",
      "D": "$10$"
    },
    "key": "A",
    "explanation": "|u|=√200=10√2."
  },
  {
    "id": "H32",
    "image": "H32.PNG",
    "text": "Jika $f(x)=(2x+1)^3$, nilai dari $f'(1)$ adalah?",
    "choices": {
      "A": "$27$",
      "B": "$54$",
      "C": "$81$",
      "D": "$108$"
    },
    "key": "B",
    "explanation": ""
  },
  {
    "id": "H33",
    "image": "H33.PNG",
    "text": "Seorang pengendara menempuh jarak yang sama saat pergi dengan kecepatan 60 km/jam dan saat pulang dengan kecepatan 40 km/jam. Berapa kecepatan rata-rata pengendara tersebut selama perjalanan pulang-pergi?",
    "choices": {
      "A": "46 km/jam",
      "B": "47 km/jam",
      "C": "48 km/jam",
      "D": "50 km/jam"
    },
    "key": "C",
    "explanation": "rata-rata harmonik = 2ab/(a+b) = (2×60×40)/100 = 48. (50 itu jebakan kalau dirata-rata biasa (60+40)/2.)"
  },
  {
    "id": "H34",
    "image": "H34.PNG",
    "text": "Hitunglah simpangan rata-rata (mean absolute deviation) dari data: 2, 4, 8, 10.",
    "choices": {
      "A": "2",
      "B": "3",
      "C": "4",
      "D": "5"
    },
    "key": "B",
    "explanation": "mean = (2+4+8+10)/4 = 6. Simpangan mutlak: \\|2-6\\|=4, \\|4-6\\|=2, \\|8-6\\|=2, \\|10-6\\|=4. Jumlah=12, dibagi 4 = 3."
  },
  {
    "id": "H35",
    "image": "H35.PNG",
    "text": "Data nilai ujian siswa disajikan dalam tabel distribusi frekuensi berikut (nilai tengah tiap kelas sudah dihitungkan). Berapa rata-rata (mean) data berkelompok tersebut?",
    "table": { "head": ["Nilai tengah", "Frekuensi"], "rows": [["3", "2"], ["8", "4"], ["13", "4"]] },
    "choices": {
      "A": "7",
      "B": "8",
      "C": "9",
      "D": "10"
    },
    "key": "C",
    "explanation": "jumlah tertimbang = 3×2+8×4+13×4 = 6+32+52 = 90. Total frekuensi = 10. Mean = 90/10 = 9."
  },
  {
    "id": "H36",
    "image": "H36.PNG",
    "text": "Dari 50 siswa, 30 orang suka Matematika, 25 orang suka Statistika, dan 12 orang suka keduanya. Berapa persen siswa yang TIDAK suka keduanya?",
    "choices": {
      "A": "10%",
      "B": "12%",
      "C": "14%",
      "D": "16%"
    },
    "key": "C",
    "explanation": "suka minimal salah satu = 30+25-12=43. Tidak suka keduanya = 50-43=7. Persen = 7/50×100% = 14%."
  },
  {
    "id": "H37",
    "image": "H37.PNG",
    "text": "Diketahui barisan aritmatika dengan suku pertama 7 dan suku ke-10 adalah 43. Berapa jumlah 10 suku pertama barisan tersebut?",
    "choices": {
      "A": "230",
      "B": "240",
      "C": "250",
      "D": "260"
    },
    "key": "C",
    "explanation": "beda: 43=7+9b ⟹ b=4. S10 = 10/2×(2×7+9×4) = 5×50 = 250."
  },
  {
    "id": "H38",
    "image": "H38.PNG",
    "text": "Data: 10, 15, 20, 25, 30, 35, 80. Berapa batas atas pencilan (upper fence) dari data tersebut, dihitung dengan rumus $Q_3 + 1{,}5\\times(Q_3-Q_1)$?",
    "choices": {
      "A": "55",
      "B": "60",
      "C": "65",
      "D": "70"
    },
    "key": "C",
    "explanation": "urut (data sudah urut). Q1 posisi (n+1)/4=2 → 15. Q3 posisi 3(n+1)/4=6 → 35. IQR=35-15=20. Pagar atas = 35+1,5×20 = 35+30 = 65."
  },
  {
    "id": "H39",
    "image": "H39.PNG",
    "text": "Peluang seorang siswa lulus Matematika adalah 0,7. Peluang lulus Statistika adalah 0,6. Peluang lulus KEDUANYA adalah 0,45. Berapa peluang siswa tersebut TIDAK lulus keduanya (gagal Matematika maupun Statistika)?",
    "choices": {
      "A": "10%",
      "B": "15%",
      "C": "20%",
      "D": "25%"
    },
    "key": "B",
    "explanation": "peluang lulus minimal satu (union) = 0,7+0,6-0,45 = 0,85. Tidak lulus keduanya = 1-0,85 = 0,15 = 15%."
  },
  {
    "id": "H40",
    "image": "H40.PNG",
    "text": "Peluang siswa suka Matematika adalah 0,6. Peluang siswa suka Matematika DAN Statistika adalah 0,24. Peluang siswa suka Matematika DAN Analisa Data adalah 0,18 (anggap suka-Statistika dan suka-Analisa-Data saling lepas). Jika diketahui siswa tersebut suka Matematika, berapa peluang dia TIDAK suka Statistika maupun Analisa Data?",
    "choices": {
      "A": "20%",
      "B": "25%",
      "C": "30%",
      "D": "35%"
    },
    "key": "C",
    "explanation": "P(Statistika\\|Matematika)=0,24/0,6=0,4. P(AnalisaData\\|Matematika)=0,18/0,6=0,3. Jumlah=0,7. Tidak keduanya = 1-0,7 = 0,3 = 30%."
  }
];

export const TEORI = [
  {
    "id": "T01",
    "image": "T01.PNG",
    "text": "Ketika data telah diurutkan dari terkecil hingga terbesar, terdapat satu ukuran yang membagi data tersebut menjadi dua bagian yang sama banyak. Ukuran tersebut disebut mean.",
    "key": "F",
    "explanation": "itu median"
  },
  {
    "id": "T02",
    "image": "T02.PNG",
    "text": "Ukuran penyebaran yang paling mudah digunakan adalah jangkauan.",
    "key": "T",
    "explanation": ""
  },
  {
    "id": "T03",
    "image": "T03.PNG",
    "text": "Nilai ekstrem yang mengubah rata-rata secara signifikan menunjukkan bahwa mean tidak dipengaruhi oleh outlier.",
    "key": "F",
    "explanation": "kontradiksi diri sendiri (kalau mean berubah signifikan, berarti mean justru dipengaruhi outlier)."
  },
  {
    "id": "T04",
    "image": "T04.PNG",
    "text": "Jika dua kejadian tidak dapat terjadi secara bersamaan dalam satu percobaan, maka kedua kejadian tersebut memiliki hubungan mutually exclusive.",
    "key": "T",
    "explanation": ""
  },
  {
    "id": "T05",
    "image": "T05.PNG",
    "text": "Perbandingan antara banyaknya kejadian yang muncul dengan seluruh percobaan disebut frekuensi harapan.",
    "key": "F",
    "explanation": "itu frekuensi relatif"
  },
  {
    "id": "T06",
    "image": "T06.PNG",
    "text": "Dalam pencacahan, jika urutan objek yang dipilih atau disusun diperhatikan, konsep yang digunakan adalah kombinasi.",
    "key": "F",
    "explanation": "itu permutasi"
  },
  {
    "id": "T07",
    "image": "T07.PNG",
    "text": "Jika seluruh nilai pada suatu data ditambah dengan konstanta yang sama, maka simpangan bakunya akan berubah.",
    "key": "F",
    "explanation": "penambahan konstanta cuma menggeser mean, simpangan baku tetap sama."
  },
  {
    "id": "T08",
    "image": "T08.PNG",
    "text": "Jika seluruh nilai pada suatu data dikalikan dengan konstanta $k$ ($k\\neq0$), maka simpangan bakunya akan menjadi $|k|$ kali simpangan baku semula.",
    "key": "T",
    "explanation": ""
  },
  {
    "id": "T09",
    "image": "T09.PNG",
    "text": "Jika dua kejadian A dan B saling bebas (independen), maka kedua kejadian tersebut pasti juga saling lepas (mutually exclusive).",
    "key": "F",
    "explanation": "independen dan saling lepas itu konsep berbeda; kalau P(A)>0 dan P(B)>0, kejadian yang independen justru gak mungkin saling lepas."
  },
  {
    "id": "T10",
    "image": "T10.PNG",
    "text": "Median tidak dipengaruhi oleh keberadaan nilai ekstrem (outlier) dalam suatu data.",
    "key": "T",
    "explanation": ""
  },
  {
    "id": "T11",
    "image": "T11.PNG",
    "text": "Banyak cara memilih 2 pengurus dari 5 kandidat untuk mengisi 2 jabatan berbeda (ketua dan sekretaris) sama dengan banyak cara memilih 2 pengurus dari 5 kandidat untuk mengisi 2 posisi yang identik (anggota biasa).",
    "key": "F",
    "explanation": "yang pertama permutasi P(5,2)=20, yang kedua kombinasi C(5,2)=10, gak sama."
  },
  {
    "id": "T12",
    "image": "T12.PNG",
    "text": "Dalam distribusi data yang menjulur ke kanan (positively skewed), nilai mean cenderung lebih besar daripada median.",
    "key": "T",
    "explanation": ""
  },
  {
    "id": "T13",
    "image": "T13.PNG",
    "text": "Semakin besar ukuran sampel acak yang diambil dari suatu populasi, rata-rata sampel akan cenderung semakin mendekati rata-rata populasi.",
    "key": "T",
    "explanation": "hukum bilangan besar / law of large numbers"
  },
  {
    "id": "T14",
    "image": "T14.PNG",
    "text": "Pada percobaan pelemparan dua dadu sekaligus, peluang munculnya jumlah mata dadu 7 adalah peluang terbesar dibandingkan jumlah mata dadu lainnya.",
    "key": "T",
    "explanation": "jumlah 7 punya 6 kombinasi dari 36 kemungkinan (1-6,2-5,3-4,4-3,5-2,6-1), lebih banyak dari kombinasi jumlah lainnya."
  },
  {
    "id": "T15",
    "image": "T15.PNG",
    "text": "Median selalu merupakan salah satu nilai yang benar-benar ada di dalam kumpulan data tersebut.",
    "key": "F",
    "explanation": "kalau n genap, median adalah rata-rata dua data tengah, yang bisa jadi bukan nilai yang ada di data (contoh: data 6 dan 8, median 7)."
  }
];

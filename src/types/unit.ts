
export interface Sentence {
  id: number;
  vietnamese: string;
  english: string;
  ipa: string;
  vocabulary: string;
}

export interface Unit {
  unitNumber: number;
  sheetName: string;
  title: string;
  sentences: Sentence[];
}

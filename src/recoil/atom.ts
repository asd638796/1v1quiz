// src/recoil/atoms.ts

import { atom } from 'recoil';

// Define the Question interface
export interface Question {
  country: string;
  capital: string;
  // Add other fields as necessary
}

// Atom for quizType
export const quizTypeState = atom<'custom' | 'default' | null>({
  key: 'quizTypeState', // unique ID (with respect to other atoms/selectors)
  default: 'default',   // default value (aka initial value)
});

// Atom for questions
export const questionsState = atom<Question[][]>({
  key: 'questionsState',
  default: [
    [
      { country: '', capital: '' },
      { country: '', capital: '' },
      { country: '', capital: '' },
      { country: '', capital: '' },
      { country: '', capital: '' },
    ],
  ],
});

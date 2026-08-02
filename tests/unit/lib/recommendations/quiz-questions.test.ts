import {
  QUIZ_TOTAL_QUESTIONS,
  QUIZ_TRACKS,
  quizPassThreshold,
} from '@/lib/recommendations/quiz-questions';

describe('quiz-questions', () => {
  const allQuestions = QUIZ_TRACKS.flatMap((track) => track.questions);

  it('cobre as quatro trilhas do laboratório', () => {
    expect(QUIZ_TRACKS.map((track) => track.id)).toEqual([
      'analogies',
      'vocabulary',
      'phase1',
      'phase2',
    ]);
  });

  it('não repete ids de pergunta', () => {
    const ids = allQuestions.map((question) => question.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('mantém QUIZ_TOTAL_QUESTIONS em sincronia', () => {
    expect(QUIZ_TOTAL_QUESTIONS).toBe(allQuestions.length);
  });

  it('tem alternativas distintas e índice correto válido', () => {
    for (const question of allQuestions) {
      expect(question.options.length).toBeGreaterThanOrEqual(3);
      expect(new Set(question.options).size).toBe(question.options.length);
      expect(question.correct).toBeGreaterThanOrEqual(0);
      expect(question.correct).toBeLessThan(question.options.length);
      expect(question.explanation.length).toBeGreaterThan(20);
    }
  });

  it('distribui a resposta certa entre as posições', () => {
    const counts = [0, 0, 0];
    for (const question of allQuestions) counts[question.correct] += 1;

    const maxShare = Math.max(...counts) / allQuestions.length;
    expect(maxShare).toBeLessThan(0.5);
  });

  it('exige 70% de acertos para aprovar a trilha', () => {
    expect(quizPassThreshold(10)).toBe(7);
    expect(quizPassThreshold(12)).toBe(9);
    expect(quizPassThreshold(1)).toBe(1);
  });
});

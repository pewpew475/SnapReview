import { evaluateCodeComplete } from '../lib/ai/evaluator.js';

const testTask = {
  title: 'Fibonacci Calculator',
  description: 'Calculate fibonacci number',
  code_content: `
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(fibonacci(10))
  `,
  programming_language: 'python',
  category: 'Algorithm',
  difficulty_level: 'Beginner',
};

evaluateCodeComplete(testTask)
  .then((result) => {
    console.log('Evaluation Result:', JSON.stringify(result, null, 2));
  })
  .catch((error) => {
    console.error('Error:', error);
  });

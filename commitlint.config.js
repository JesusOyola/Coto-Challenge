module.exports = {
  extends: ['@commitlint/config-conventional'],

  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'style', 'refactor', 'refactor-style', 'test', 'revert', 'build'],
    ],

    'header-max-length': [2, 'always', 50],

    'subject-case': [0, 'always', 'lower-case'],
  },
};

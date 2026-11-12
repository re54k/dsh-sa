module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', ['feature', 'optimize', 'fix', 'delete', 'chore', 'docs', 'test', 'style', 'refactor']],
    'type-case': [2, 'always', ['lower-case']],
    'scope-empty': [2, 'never'],
    'scope-case': [2, 'always', ['lower-case', 'upper-case', 'camel-case']],
    'subject-empty': [2, 'never'],
    'jira-id': [2, 'always'],
  },
  plugins: [
    {
      rules: {
        'jira-id': ({ subject }) => [
          /\s[A-Z0-9]+-\d+$/.test(subject),
          '提交信息缺少JIRA字段，末尾必须包含一个空格加上JIRA-id。',
        ],
      },
    },
  ],
}

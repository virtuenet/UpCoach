module.exports = {
  parse: jest.fn().mockReturnValue({
    host: 'localhost',
    port: 5432,
    user: 'test',
    password: 'test',
    database: 'testdb'
  })
};
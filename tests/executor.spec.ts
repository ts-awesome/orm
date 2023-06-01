import {NamedParameter} from "../src/wrappers";
import {TestExecutor} from "../src/test-driver";

describe('BaseExecutor', () => {

  it('named params', async () => {
    const sqlName = 'test';
    const namedParam = new NamedParameter(sqlName);

    const executor = new TestExecutor();

    executor.mapper = (query) => {
      expect(query).toBeDefined()
      expect(query.params).toBeDefined()
      expect(query.params[sqlName]).toBe(123)
      return []
    }

    executor.setNamedParameter(namedParam, 123)

    await executor.execute({});
  });

})

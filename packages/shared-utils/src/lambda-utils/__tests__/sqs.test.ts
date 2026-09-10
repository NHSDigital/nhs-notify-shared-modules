import { readSqsStringAttribute } from '../sqs';

describe('readSqsStringAttribute', () => {
  it('returns the string value when the attribute exists and has String dataType', () => {
    const record = {
      messageAttributes: {
        correlationId: { dataType: 'String', stringValue: 'abc-123' },
      },
    };
    expect(readSqsStringAttribute(record, 'correlationId')).toBe('abc-123');
  });

  it('returns undefined when the attribute does not exist', () => {
    const record = { messageAttributes: {} };
    expect(readSqsStringAttribute(record, 'correlationId')).toBeUndefined();
  });

  it('returns undefined when the attribute has a non-String dataType', () => {
    const record = {
      messageAttributes: {
        correlationId: { dataType: 'Number', stringValue: '123' },
      },
    };
    expect(readSqsStringAttribute(record, 'correlationId')).toBeUndefined();
  });

  it('returns undefined when the attribute has no stringValue', () => {
    const record = {
      messageAttributes: {
        correlationId: { dataType: 'String' },
      },
    };
    expect(readSqsStringAttribute(record, 'correlationId')).toBeUndefined();
  });
});

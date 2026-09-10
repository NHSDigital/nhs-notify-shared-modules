export const CORRELATION_ID_ATTRIBUTE = 'correlationId' as const;

export interface SqsMessageAttributeLike {
  dataType?: string;
  stringValue?: string;
}

export interface SqsRecordLike {
  messageAttributes: Record<string, SqsMessageAttributeLike | undefined>;
}

export function readSqsStringAttribute(
  record: SqsRecordLike,
  attributeName: string,
): string | undefined {
  // eslint-disable-next-line security/detect-object-injection -- attributeName is always a controlled string literal at call sites
  const attribute = record.messageAttributes[attributeName];
  if (attribute?.dataType !== 'String') return undefined;
  return attribute.stringValue;
}

import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';

export const MODELO_PADRAO = 'us.amazon.nova-2-lite-v1:0';

/** Bedrock em us-east-1, só modelos da Amazon. Credenciais pela cadeia padrão da AWS (AWS_PROFILE etc.); nada no código. */
export function modelo() {
  const bedrock = createAmazonBedrock({ region: 'us-east-1', credentialProvider: fromNodeProviderChain() });
  return bedrock(process.env.ZEFE_MODELO || MODELO_PADRAO);
}

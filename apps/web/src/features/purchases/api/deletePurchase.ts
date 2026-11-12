import client from '../../../lib/rpcClient';

const $delete = client.purchases[':id'].$delete;
type DeletePurchaseParams = {
  id: number;
  version: number;
};
export default async function deletePurchase(params: DeletePurchaseParams) {
  const Id = String(params.id);
  const Version = String(params.version);
  const result = await $delete({
    param: { id: Id },
    query: { version: Version },
  });

  if (!result.ok) {
    throw new Error('Failed to delete purchase');
  }

  return result;
}

export const bankTransferConfig = {
  bankId: import.meta.env.VITE_BANK_ID || 'MB',
  accountNo: import.meta.env.VITE_BANK_ACCOUNT_NO || '0000000000',
  accountName: import.meta.env.VITE_BANK_ACCOUNT_NAME || 'GEAR RENTAL',
  template: import.meta.env.VITE_BANK_TEMPLATE || 'compact2',
};

export const isBankTransferConfigured = bankTransferConfig.accountNo !== '0000000000';

export const buildTransferContent = (orderId, phone = '') => {
  const cleanPhone = String(phone || '').replace(/\D/g, '');
  const orderCode = orderId ? `DH${orderId}` : 'DAT HANG';
  return ['GR', orderCode, cleanPhone].filter(Boolean).join(' ');
};

export const buildVietQrUrl = ({ amount, orderId, phone }) => {
  const roundedAmount = Math.max(0, Math.round(Number(amount) || 0));
  const content = buildTransferContent(orderId, phone);
  const { bankId, accountNo, accountName, template } = bankTransferConfig;
  const params = new URLSearchParams({
    amount: String(roundedAmount),
    addInfo: content,
    accountName,
  });

  return `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.png?${params.toString()}`;
};

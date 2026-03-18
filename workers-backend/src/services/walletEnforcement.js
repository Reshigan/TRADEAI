export class WalletEnforcementService {
  constructor(db) { this.db = db; }

  async checkBalance(walletId, amount) {
    const wallet = await this.db.prepare(
      'SELECT allocated_amount, utilized_amount, committed_amount FROM kam_wallets WHERE id = ?'
    ).bind(walletId).first();
    if (!wallet) throw new Error('Wallet not found');
    const available = (wallet.allocated_amount || 0) - (wallet.utilized_amount || 0) - (wallet.committed_amount || 0);
    if (amount > available) throw new Error(`Insufficient wallet balance. Available: R${available.toFixed(2)}, Requested: R${amount.toFixed(2)}`);
    return { available, sufficient: true };
  }

  async commitFromWallet(walletId, amount, promotionId) {
    await this.db.prepare(
      'UPDATE kam_wallets SET committed_amount = committed_amount + ?, updated_at = datetime("now") WHERE id = ?'
    ).bind(amount, walletId).run();
    await this.db.prepare(
      'INSERT INTO kam_wallet_transactions (id, wallet_id, transaction_type, amount, reference_type, reference_id, created_at) VALUES (?, ?, "commit", ?, "promotion", ?, datetime("now"))'
    ).bind(crypto.randomUUID(), walletId, amount, promotionId).run();
  }

  async releaseFromWallet(walletId, amount) {
    await this.db.prepare(
      'UPDATE kam_wallets SET committed_amount = MAX(0, committed_amount - ?), updated_at = datetime("now") WHERE id = ?'
    ).bind(amount, walletId).run();
  }

  async spendFromWallet(walletId, committedAmount, actualAmount) {
    await this.db.prepare(
      `UPDATE kam_wallets SET committed_amount = MAX(0, committed_amount - ?), utilized_amount = utilized_amount + ?, updated_at = datetime("now") WHERE id = ?`
    ).bind(committedAmount, actualAmount, walletId).run();
  }

  async getWalletForUser(userId, companyId, year) {
    return this.db.prepare(
      "SELECT * FROM kam_wallets WHERE user_id = ? AND company_id = ? AND year = ? AND status = 'active'"
    ).bind(userId, companyId, year || new Date().getFullYear()).first();
  }
}

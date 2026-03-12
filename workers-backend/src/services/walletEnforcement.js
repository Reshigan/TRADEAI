export class WalletEnforcementService {
  constructor(db) { this.db = db; }

  async getWalletForUser(userId, companyId, year) {
    return this.db.prepare(
      "SELECT * FROM kam_wallets WHERE user_id = ? AND company_id = ? AND year = ? AND status = 'active'"
    ).bind(userId, companyId, year || new Date().getFullYear()).first();
  }

  async checkAndCommit(userId, companyId, amount, entityType, entityId) {
    const wallet = await this.getWalletForUser(userId, companyId);
    if (!wallet) throw new Error('No active wallet found for this KAM');
    const available = (wallet.allocated_amount || 0) - (wallet.committed_amount || 0) - (wallet.utilized_amount || 0);
    if (amount > available) {
      throw new Error(`Wallet insufficient. Available: R${available.toLocaleString()}. Required: R${amount.toLocaleString()}.`);
    }
    await this.db.prepare(
      'UPDATE kam_wallets SET committed_amount = committed_amount + ?, updated_at = datetime("now") WHERE id = ?'
    ).bind(amount, wallet.id).run();
    return { walletId: wallet.id, available: available - amount };
  }

  async recordSpend(walletId, committedAmount, actualAmount) {
    await this.db.prepare(`
      UPDATE kam_wallets SET
        committed_amount = MAX(0, committed_amount - ?),
        utilized_amount = utilized_amount + ?,
        available_amount = MAX(0, allocated_amount - committed_amount + ? - utilized_amount - ?),
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(committedAmount, actualAmount, committedAmount, actualAmount, walletId).run();
  }

  async releaseCommitted(walletId, amount) {
    await this.db.prepare(
      'UPDATE kam_wallets SET committed_amount = MAX(0, committed_amount - ?), updated_at = datetime("now") WHERE id = ?'
    ).bind(amount, walletId).run();
  }
}

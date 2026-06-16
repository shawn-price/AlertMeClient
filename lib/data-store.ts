"use client"

import { generateDebitAlert, generateCreditAlert } from "./alert-templates"
import { sendTransactionAlert } from "./sms-client"
import { SMSService } from "./sms-service"
import { StorageManager } from "./storage-manager"
import { formatCurrency } from "@/lib/form-utils"
import { GatewayConfig } from "@/lib/sms-gateways/types"

export interface Transaction {
  id: string
  type: string
  amount: number
  recipient?: string
  sender?: string
  date: string
  time: string
  status: "Successful" | "Pending" | "Failed"
  reference: string
  description: string
  isDebit: boolean
  section: string
  recipientBank?: string
  senderBank?: string
  recipientAccount?: string
  senderAccount?: string
  fee?: number
}

export interface Beneficiary {
  id: string
  name: string
  accountNumber: string
  bank: string
  phone?: string
}

export interface UserData {
  name: string
  accountNumber: string
  phone: string
  balance: number
  email: string
  address: string
  bvn: string
  profilePicture?: string
  status: "Active" | "Inactive"
  latitude?: number
  longitude?: number
}

export interface Notification {
  id: string
  title: string
  message: string
  type: "success" | "info" | "warning" | "error"
  timestamp: string
  read: boolean
}

export interface NotificationLog {
  id: string
  transactionId: string
  type: "sms" | "email" | "push"
  status: "pending" | "sent" | "failed" | "delivered"
  recipient: string
  templateUsed: string
  timestamp: string
  message: string
  deliveryAttempts?: number
  lastError?: string
}

export interface LoanApplication {
  id: string
  type: string
  amount: number
  term: number
  purpose: string
  status: "Draft" | "Submitted" | "Under Review" | "Approved" | "Rejected"
  applicationDate: string
  monthlyPayment: number
  interestRate: number
  totalRepayment: number
  uploadedDocuments?: {
    bankStatement?: boolean
    employmentLetter?: boolean
    guarantors?: boolean
    idVerification?: boolean
    loanDeposit?: boolean
  }
}

export interface AppSettings {
  theme: string
  notifications: boolean
  smsAlerts: boolean
  biometricLogin: boolean
  language: string
}

interface AppState {
  userData: UserData
  transactions: Transaction[]
  beneficiaries: Beneficiary[]
  notifications: Notification[]
  loanApplications: LoanApplication[]
  settings: AppSettings
  smsGatewayConfigs: GatewayConfig[]
  lastSynced: string
  version: number
}

class DataStore {
  private static instance: DataStore
  private state: AppState
  private listeners: Set<() => void> = new Set()
  private notificationLogs: NotificationLog[] = []
  private readonly STORAGE_KEY = "ecobank_app_data"
  private readonly BACKUP_KEY = "ecobank_app_backup"
  private readonly VERSION = 1
  private saveTimeout: NodeJS.Timeout | null = null
  private readonly DEBOUNCE_DELAY = 2000 // 2 second debounce for saves
  private notifyTimeout: NodeJS.Timeout | null = null
  private readonly NOTIFY_DEBOUNCE_DELAY = 300 // 300ms debounce for notifications

  static getInstance(): DataStore {
    if (!DataStore.instance) {
      DataStore.instance = new DataStore()
    }
    return DataStore.instance
  }

  private constructor() {
    this.state = this.loadFromStorage()
    this.initializeDefaultData()
    this.loadNotificationLogs()

    // Initialize IndexedDB for better scalability
    if (typeof window !== "undefined") {
      StorageManager.initIndexedDB().catch((err) => console.warn("IndexedDB initialization failed:", err))

      // Request persistent storage quota
      StorageManager.requestPersistentStorage().catch((err) =>
        console.warn("Failed to request persistent storage:", err),
      )

      // Load profile picture from persistent storage asynchronously
      this.loadProfilePicture().catch((err) => console.warn("Failed to load profile picture on init:", err))

      // Auto-save with debouncing
      window.addEventListener("beforeunload", () => this.saveToStorage())
    }
  }

  private getDefaultState(): AppState {
    return {
      userData: {
        name: "ADEFEMI JOHN OLAYEMI",
        accountNumber: "0099348976",
        phone: "+234 801 234 5678",
        balance: 150000.2,
        email: "john.olayemi@email.com",
        address: "123 Lagos Street, Victoria Island, Lagos",
        bvn: "22123456789",
        status: "Active",
        profilePicture: undefined,
      },
      transactions: [
        {
          id: "1",
          type: "Transfer to other bank",
          amount: 20000,
          recipient: "Pedro Banabas",
          date: "2023-05-19",
          time: "10:15AM",
          status: "Successful",
          reference: "TXN123456789",
          description: "Transfer to First Bank",
          isDebit: true,
          section: "Today",
          recipientBank: "First Bank",
          recipientAccount: "0348483930",
          senderAccount: "0099348976",
          fee: 30,
        },
        {
          id: "2",
          type: "Bank Deposit",
          amount: 50000,
          sender: "John Smith",
          date: "2023-05-19",
          time: "09:30AM",
          status: "Successful",
          reference: "TXN123456788",
          description: "Cash deposit",
          isDebit: false,
          section: "Today",
          senderBank: "Ecobank",
          senderAccount: "0099348977",
        },
      ],
      beneficiaries: [
        {
          id: "1",
          name: "Pedro Banabas",
          accountNumber: "0348483930",
          bank: "First Bank",
          phone: "+234 803 123 4567",
        },
        {
          id: "2",
          name: "Sarah Johnson",
          accountNumber: "0123456789",
          bank: "GTBank",
          phone: "+234 801 987 6543",
        },
        {
          id: "3",
          name: "Chisom Nwosu",
          accountNumber: "1234567890",
          bank: "Access Bank",
          phone: "+234 805 567 8901",
        },
        {
          id: "4",
          name: "Amara Okonkwo",
          accountNumber: "2345678901",
          bank: "Zenith Bank",
          phone: "+234 807 234 5678",
        },
        {
          id: "5",
          name: "David Adeyemi",
          accountNumber: "3456789012",
          bank: "United Bank for Africa",
          phone: "+234 809 876 5432",
        },
        {
          id: "6",
          name: "Nneka Okafor",
          accountNumber: "4567890123",
          bank: "Fidelity Bank",
          phone: "+234 810 456 7890",
        },
        {
          id: "7",
          name: "Tosin Oluwaseun",
          accountNumber: "5678901234",
          bank: "Guaranty Trust Bank",
          phone: "+234 812 789 0123",
        },
        {
          id: "8",
          name: "Zainab Mohammed",
          accountNumber: "6789012345",
          bank: "FCMB",
          phone: "+234 814 123 4567",
        },
        {
          id: "9",
          name: "Chukwuma Ejiofor",
          accountNumber: "7890123456",
          bank: "Ecobank",
          phone: "+234 816 567 8901",
        },
        {
          id: "10",
          name: "Blessing Okoro",
          accountNumber: "8901234567",
          bank: "Sterling Bank",
          phone: "+234 818 234 5678",
        },
        {
          id: "11",
          name: "Michael Eze",
          accountNumber: "9012345678",
          bank: "First Bank",
          phone: "+234 820 890 1234",
        },
        {
          id: "12",
          name: "Ada Uchenna",
          accountNumber: "0912345678",
          bank: "Access Bank",
          phone: "+234 821 456 7890",
        },
        {
          id: "13",
          name: "Kunle Adebayo",
          accountNumber: "1923456789",
          bank: "United Bank for Africa",
          phone: "+234 822 123 4567",
        },
        {
          id: "14",
          name: "Fatima Hassan",
          accountNumber: "2034567890",
          bank: "First Bank",
          phone: "+234 823 789 0123",
        },
        {
          id: "15",
          name: "Victor Oluwole",
          accountNumber: "3145678901",
          bank: "GTBank",
          phone: "+234 824 456 7890",
        },
        {
          id: "16",
          name: "Ngozi Okeke",
          accountNumber: "4256789012",
          bank: "Zenith Bank",
          phone: "+234 825 012 3456",
        },
        {
          id: "17",
          name: "Emmanuel Obi",
          accountNumber: "5367890123",
          bank: "Ecobank",
          phone: "+234 826 678 9012",
        },
        {
          id: "18",
          name: "Grace Ayokunle",
          accountNumber: "6478901234",
          bank: "Fidelity Bank",
          phone: "+234 827 345 6789",
        },
        {
          id: "19",
          name: "Samuel Ifeanyi",
          accountNumber: "7589012345",
          bank: "Access Bank",
          phone: "+234 828 901 2345",
        },
        {
          id: "20",
          name: "Cynthia Obinna",
          accountNumber: "8690123456",
          bank: "Sterling Bank",
          phone: "+234 829 567 8901",
        },
      ],
      notifications: [],
      loanApplications: [],
      settings: {
        theme: "default",
        notifications: true,
        smsAlerts: true,
        biometricLogin: false,
        language: "en",
      },
      smsGatewayConfigs: [
        {
          name: "infobip",
          enabled: false,
          priority: 1,
          credentials: {
            apiKey: "",
            username: "",
            baseUrl: "",
          },
        },
        {
          name: "smsglobal",
          enabled: false,
          priority: 2,
          credentials: {
            apiKey: "",
            endpoint: "",
          },
        },
        {
          name: "easysendsms",
          enabled: false,
          priority: 3,
          credentials: {
            apiKey: "",
            username: "",
            endpoint: "",
          },
        },
        {
          name: "telnyx",
          enabled: false,
          priority: 4,
          credentials: {
            apiKey: "",
            messagingProfileId: "",
            endpoint: "",
          },
        },
      ],
      lastSynced: new Date().toISOString(),
      version: this.VERSION,
    }
  }

  private loadFromStorage(): AppState {
    try {
      const stored: any = StorageManager.loadSync(this.STORAGE_KEY, null)
      if (stored) {
        // Validate version and migrate if needed
        if (stored.version !== this.VERSION) {
          console.log("Data version mismatch, performing migration")
          return this.migrateData(stored)
        }
        return stored
      }
    } catch (error) {
      console.error("Failed to load from storage:", error)
    }
    return this.getDefaultState()
  }

  private migrateData(oldState: any): AppState {
    // Handle data migrations between versions here
    const newState = this.getDefaultState()
    if (oldState.userData) {
      newState.userData = { ...newState.userData, ...oldState.userData }
    }
    if (oldState.transactions) {
      newState.transactions = oldState.transactions
    }
    if (oldState.beneficiaries) {
      newState.beneficiaries = oldState.beneficiaries
    }
    newState.version = this.VERSION
    return newState
  }

  private saveToStorage(): void {
    try {
      this.state.lastSynced = new Date().toISOString()
      StorageManager.saveSync(this.STORAGE_KEY, this.state)

      this.createAutoBackup()
    } catch (error) {
      console.error("Failed to save to storage:", error)
    }
  }

  private initializeDefaultData(): void {
    const defaultState = this.getDefaultState()

    // Initialize transactions only if none exist
    if (this.state.transactions.length === 0) {
      this.state.transactions = defaultState.transactions
    }

    // Merge default beneficiaries into existing list to ensure defaults are present
    const existingAccounts = new Set(this.state.beneficiaries.map((b) => b.accountNumber.trim()))
    for (const ben of defaultState.beneficiaries) {
      if (!existingAccounts.has(ben.accountNumber.trim())) {
        this.state.beneficiaries.push(ben)
      }
    }
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private notify() {
    // Debounce listener notifications to prevent excessive re-renders
    if (this.notifyTimeout) clearTimeout(this.notifyTimeout)
    this.notifyTimeout = setTimeout(() => {
      this.listeners.forEach((listener) => listener())
    }, this.NOTIFY_DEBOUNCE_DELAY)

    // Debounce storage saves to prevent excessive I/O
    if (this.saveTimeout) clearTimeout(this.saveTimeout)
    this.saveTimeout = setTimeout(() => this.saveToStorage(), this.DEBOUNCE_DELAY)
  }

  // User data methods
  getUserData(): UserData {
    return { ...this.state.userData }
  }

  updateUserData(updates: Partial<UserData>): void {
    this.state.userData = { ...this.state.userData, ...updates }
    this.notify()
  }

  updateBalance(newBalance: number): void {
    // Ensure balance is stored with two decimals to prevent floating point drift
    this.state.userData.balance = Number(Number(newBalance).toFixed(2))
    this.notify()
  }

  updateProfilePicture(pictureUrl: string): void {
    const maxSize = 500000 // 500KB limit for localStorage
    const indexedDBThreshold = 100000 // 100KB threshold before using IndexedDB

    let optimizedUrl = pictureUrl
    let useIndexedDB = false

    if (pictureUrl && pictureUrl.length > maxSize) {
      console.warn("[v0] Profile picture exceeds localStorage limit, will use IndexedDB")
      useIndexedDB = true
    } else if (pictureUrl && pictureUrl.length > indexedDBThreshold) {
      // Use IndexedDB for large images even if they fit in localStorage
      useIndexedDB = true
    }

    // Store in memory first
    this.state.userData.profilePicture = optimizedUrl

    // For large images, store separately in IndexedDB
    if (useIndexedDB && pictureUrl) {
      StorageManager.save("ecobank_profile_picture", pictureUrl).catch((err) => {
        console.error("[v0] Failed to save profile picture to IndexedDB:", err)
      })
    }

    this.saveToStorage()
    this.notify()
  }

  async loadProfilePicture(): Promise<void> {
    try {
      // Try to load from IndexedDB first (for large images)
      const indexedDBPicture = await StorageManager.load<string>("ecobank_profile_picture", "")
      if (indexedDBPicture) {
        this.state.userData.profilePicture = indexedDBPicture
        this.notify()
        return
      }

      // If no IndexedDB picture, check if the current profile picture is already loaded
      // The profile picture should already be loaded from the main state during initialization
      // This method ensures we have the most up-to-date version from persistent storage
    } catch (error) {
      console.warn("[DataStore] Failed to load profile picture from IndexedDB:", error)
    }
  }

  // Transaction methods
  getTransactions(): Transaction[] {
    return [...this.state.transactions].sort(
      (a, b) => new Date(`${b.date} ${b.time}`).getTime() - new Date(`${a.date} ${a.time}`).getTime(),
    )
  }

  getTransaction(id: string): Transaction | undefined {
    return this.state.transactions.find((t) => t.id === id)
  }

  async addTransaction(transaction: Omit<Transaction, "id" | "reference" | "date" | "time">): Promise<string> {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const reference = `TXN${Date.now().toString().slice(-9)}`

    const newTransaction: Transaction = {
      ...transaction,
      id,
      reference,
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }
    
    this.logNotification({
      transactionId: id,
      type: "sms",
      status: "pending",
      recipient: newTransaction.recipient || "",
      templateUsed: newTransaction.recipientBank || "default",
      timestamp: new Date().toISOString(),
      message: `Transaction alert for ${newTransaction.type}`,
    })

    // Ensure amount and fee are numbers rounded to 2 decimals
    newTransaction.amount = Number(Number(newTransaction.amount).toFixed(2))
    if (newTransaction.fee !== undefined) newTransaction.fee = Number(Number(newTransaction.fee).toFixed(2))

    this.state.transactions.unshift(newTransaction)

    // Update balance with precise rounding to avoid float accumulation
    if (newTransaction.isDebit) {
      const delta = -(newTransaction.amount + (newTransaction.fee || 0))
      this.state.userData.balance = Number((this.state.userData.balance + delta).toFixed(2))
    } else {
      const delta = newTransaction.amount
      this.state.userData.balance = Number((this.state.userData.balance + delta).toFixed(2))
    }

    // Send SMS notifications if enabled
    if (this.state.settings.smsAlerts) {
      if (newTransaction.isDebit && newTransaction.recipient) {
        const debitMessage = generateDebitAlert(
          newTransaction.amount,
          newTransaction.recipient,
          this.state.userData.balance,
          reference,
        )

        await sendTransactionAlert({
          to: this.state.userData.phone,
          message: debitMessage,
          type: "debit",
        })

        // Send credit alert to recipient if phone available
        const beneficiary = this.state.beneficiaries.find((b) => b.name === newTransaction.recipient)
        if (beneficiary?.phone) {
          const creditMessage = generateCreditAlert(
            newTransaction.amount,
            this.state.userData.name,
            0, // We don't know recipient's balance
            reference,
          )

          await sendTransactionAlert({
            to: beneficiary.phone,
            message: creditMessage,
            type: "credit",
          })
        }
      }
      
      if (newTransaction.isDebit && newTransaction.recipientBank) {
        await SMSService.sendDynamicTransactionAlert(newTransaction.recipientBank, {
          amount: newTransaction.amount,
          recipient: newTransaction.recipient || "",
          sender: this.state.userData.name,
          balance: this.state.userData.balance,
          reference: reference,
          beneficiaryName: newTransaction.recipient || "",
          accountNumber: newTransaction.recipientAccount || "",
          description: newTransaction.description || "Transfer",
          transactionType: newTransaction.isDebit ? "Debit" : "Credit",
        }, {
          includeRegulatoryDisclaimer: true,
          includeOptOut: true
        })
      }
    }

    // Add in-app notification
    this.addNotification({
      title: newTransaction.isDebit ? "Money Sent" : "Money Received",
      message: `₦${formatCurrency(newTransaction.amount)} ${newTransaction.isDebit ? "sent to" : "received from"} ${newTransaction.recipient || newTransaction.sender}`,
      type: "success",
    })

    this.notify()
    return id
  }

  // Beneficiary methods
  getBeneficiaries(): Beneficiary[] {
    return [...this.state.beneficiaries]
  }

  findBeneficiaryByAccount(accountNumber: string): Beneficiary | undefined {
    const trimmedAccount = accountNumber.trim()
    return this.state.beneficiaries.find((b) => b.accountNumber.trim() === trimmedAccount)
  }

  addBeneficiary(beneficiary: Omit<Beneficiary, "id">): string {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    this.state.beneficiaries.push({ ...beneficiary, id })
    this.notify()
    return id
  }

  deleteBeneficiary(id: string): boolean {
    const initialLength = this.state.beneficiaries.length
    this.state.beneficiaries = this.state.beneficiaries.filter((b) => b.id !== id)
    const deleted = this.state.beneficiaries.length < initialLength
    if (deleted) {
      this.notify()
    }
    return deleted
  }

  updateBeneficiary(id: string, updates: Partial<Beneficiary>): boolean {
    const beneficiary = this.state.beneficiaries.find((b) => b.id === id)
    if (beneficiary) {
      Object.assign(beneficiary, updates)
      this.notify()
      return true
    }
    return false
  }

  // Notification methods
  getNotifications(): Notification[] {
    return [...this.state.notifications].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
  }

  addNotification(notification: Omit<Notification, "id" | "timestamp" | "read">): void {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    this.state.notifications.unshift({
      ...notification,
      id,
      timestamp: new Date().toISOString(),
      read: false,
    })
    this.notify()
  }

  markNotificationAsRead(id: string): void {
    const notification = this.state.notifications.find((n) => n.id === id)
    if (notification) {
      notification.read = true
      this.notify()
    }
  }

  getUnreadNotificationCount(): number {
    return this.state.notifications.filter((n) => !n.read).length
  }

  // Loan application methods
  getLoanApplications(): LoanApplication[] {
    return [...this.state.loanApplications]
  }

  addLoanApplication(application: Omit<LoanApplication, "id" | "applicationDate">): string {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newApplication: LoanApplication = {
      ...application,
      id,
      applicationDate: new Date().toISOString(),
    }

    this.state.loanApplications.push(newApplication)

    this.addNotification({
      title: "Loan Application Submitted",
      message: `Your ${application.type} application for ₦${formatCurrency(application.amount)} has been submitted`, 
      type: "info",
    })

    this.notify()
    return id
  }

  updateLoanApplicationStatus(id: string, status: LoanApplication["status"]): void {
    const application = this.state.loanApplications.find((app) => app.id === id)
    if (application) {
      application.status = status
      this.addNotification({
        title: "Loan Application Update",
        message: `Your loan application status has been updated to: ${status}`,
        type: status === "Approved" ? "success" : status === "Rejected" ? "error" : "info",
      })
      this.notify()
    }
  }

  // Settings methods
  getSettings(): AppSettings {
    return { ...this.state.settings }
  }

  updateSettings(updates: Partial<AppSettings>): void {
    this.state.settings = { ...this.state.settings, ...updates }
    this.notify()
  }

  // Utility methods
  clearAllData(): void {
    // Save profile picture before clearing
    const profilePicture = this.state.userData.profilePicture
    StorageManager.clear()
    this.state = this.getDefaultState()
    // Restore profile picture if it exists
    if (profilePicture) {
      this.state.userData.profilePicture = profilePicture
    }
    this.notify()
  }

  exportData(): string {
    return JSON.stringify(
      {
        data: this.state,
        timestamp: new Date().toISOString(),
        version: this.VERSION,
      },
      null,
      2,
    )
  }

  async importData(jsonData: string): Promise<boolean> {
    try {
      const importedData: any = JSON.parse(jsonData)

      if (importedData.version !== this.VERSION) {
        console.warn("Imported data version mismatch, attempting migration")
        importedData.data = this.migrateData(importedData.data)
      }

      this.state = importedData.data
      this.notify()
      return true
    } catch (error) {
      console.error("Failed to import data:", error)
      return false
    }
  }

  async restoreFromBackup(): Promise<boolean> {
    try {
      const backup: any = StorageManager.loadSync(this.BACKUP_KEY, null)
      if (!backup) return false

      this.state = backup.data
      this.notify()
      return true
    } catch (error) {
      console.error("Failed to restore from backup:", error)
      return false
    }
  }

  getStorageStats(): {
    totalTransactions: number
    totalBeneficiaries: number
    currentBalance: number
    lastSynced: string
  } {
    return {
      totalTransactions: this.state.transactions.length,
      totalBeneficiaries: this.state.beneficiaries.length,
      currentBalance: this.state.userData.balance,
      lastSynced: this.state.lastSynced,
    }
  }

  // New account registration method
  registerNewAccount(accountData: {
    name: string
    accountNumber: string
    email: string
    phone: string
    pin: string
  }): void {
    this.state.userData = {
      name: accountData.name,
      accountNumber: accountData.accountNumber,
      phone: accountData.phone,
      balance: 0,
      email: accountData.email,
      address: "",
      bvn: "",
      status: "Active",
      profilePicture: undefined,
    }
    // PIN is handled by the login screen, not stored here for security
    this.state.transactions = []
    this.state.beneficiaries = []
    this.notify()
  }

  // Method to check if account exists
  hasExistingAccount(): boolean {
    return this.state.userData.accountNumber !== ""
  }

  private loadNotificationLogs(): void {
    try {
      const stored = StorageManager.loadSync<NotificationLog[]>("ecobank_notification_logs", [])
      if (Array.isArray(stored)) {
        this.notificationLogs = stored
      }
    } catch (error) {
      console.warn("Failed to load notification logs:", error)
      this.notificationLogs = []
    }
  }

  private logNotification(log: Omit<NotificationLog, "id">): void {
    try {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      this.notificationLogs.push({ ...log, id })
      // Keep only recent logs (last 100)
      if (this.notificationLogs.length > 100) {
        this.notificationLogs = this.notificationLogs.slice(-100)
      }
      StorageManager.saveSync("ecobank_notification_logs", this.notificationLogs)
    } catch (error) {
      console.warn("Failed to log notification:", error)
    }
  }

  private createAutoBackup(): void {
    try {
      const backup = {
        data: this.state,
        timestamp: new Date().toISOString(),
        version: this.VERSION,
      }
      StorageManager.saveSync(this.BACKUP_KEY, backup)
    } catch (error) {
      console.warn("Failed to create backup:", error)
    }
  }

  // SMS Gateway configuration methods
  getSMSGatewayConfigs(): GatewayConfig[] {
    return [...this.state.smsGatewayConfigs]
  }

  setSMSGatewayConfigs(configs: GatewayConfig[]): void {
    this.state.smsGatewayConfigs = configs.map((c) => ({ ...c }))
    this.notify()
  }

  updateSMSGatewayConfig(gatewayName: string, updates: Partial<GatewayConfig>): boolean {
    const config = this.state.smsGatewayConfigs.find((c) => c.name === gatewayName)
    if (config) {
      Object.assign(config, updates)
      this.notify()
      return true
    }
    return false
  }
}

export const dataStore = DataStore.getInstance()

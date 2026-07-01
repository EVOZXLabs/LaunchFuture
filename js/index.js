// =====================================================
// LaunchFuture - Core UI & Integration Controller
// File: js/index.js
// =====================================================

import deployManager, { DEPLOY_STATUS } from "./deploy.js";
import { connectWallet, isConnected } from "./wallet.js";

// State Global Aplikasi Front-End
const state = {
    currentStep: 1,
    totalSteps: 6,
    formData: {
        name: "",
        symbol: "",
        supply: "1000000",
        decimals: "18",
        owner: "",
        features: {
            mintable: false,
            burnable: false,
            trading: false,
            tradingDelay: false,
            antiBot: false,
            blacklist: false,
            whitelist: false,
            maxWallet: false,
            maxTx: false
        },
        metadata: {
            website: "",
            whitepaper: "",
            telegram: "",
            twitter: "",
            discord: "",
            github: "",
            description: ""
        }
    }
};

// =====================================================
// Inisialisasi Aplikasi Saat DOM Siap
// =====================================================
document.addEventListener("DOMContentLoaded", () => {
    initDOMEventListeners();
    syncFormToState();
    updateUI();
});

// =====================================================
// Perekaman Event Listener Elemen HTML
// =====================================================
function initDOMEventListeners() {
    // Navigasi Wizard
    document.getElementById("nextButton").addEventListener("click", nextStep);
    document.getElementById("backButton").addEventListener("click", prevStep);
    
    // Tombol Mulai di Hero
    const startBtn = document.getElementById("startLaunchButton");
    if (startBtn) {
        startBtn.addEventListener("click", () => goToStep(2));
    }

    // Pemicu Tombol Wallet (Top Bar dan Step 1)
    document.getElementById("connectWalletButton").addEventListener("click", handleWalletConnection);
    document.getElementById("stepConnectWalletButton").addEventListener("click", handleWalletConnection);

    // Pemantauan input data Token (Step 2)
    document.getElementById("tokenName").addEventListener("input", (e) => {
        state.formData.name = e.target.value;
        updateLivePreview();
    });
    document.getElementById("tokenSymbol").addEventListener("input", (e) => {
        state.formData.symbol = e.target.value.toUpperCase();
        updateLivePreview();
    });
    document.getElementById("tokenSupply").addEventListener("input", (e) => {
        state.formData.supply = e.target.value;
        updateLivePreview();
    });
    document.getElementById("tokenOwner").addEventListener("input", (e) => {
        state.formData.owner = e.target.value;
        updateLivePreview();
    });

    // Pemantauan Fitur Checkbox (Step 3)
    const featureIds = [
        { id: "featureMintable", key: "mintable" },
        { id: "featureBurnable", key: "burnable" },
        { id: "featureTrading", key: "trading" },
        { id: "featureTradingDelay", key: "tradingDelay" },
        { id: "featureAntiBot", key: "antiBot" },
        { id: "featureBlacklist", key: "blacklist" },
        { id: "featureWhitelist", key: "whitelist" },
        { id: "featureMaxWallet", key: "maxWallet" },
        { id: "featureMaxTx", key: "maxTx" }
    ];

    featureIds.forEach(item => {
        const el = document.getElementById(item.id);
        if (el) {
            el.addEventListener("change", (e) => {
                state.formData.features[item.key] = e.target.checked;
                updateLivePreview();
            });
        }
    });

    // Pemantauan Metadata/Branding (Step 4)
    const metadataFields = ["website", "telegram", "twitter", "projectDescription"];
    metadataFields.forEach(field => {
        const el = document.getElementById(field === "projectDescription" ? "projectDescription" : field);
        if (el) {
            el.addEventListener("input", (e) => {
                state.formData.metadata[field] = e.target.value;
            });
        }
    });

    // Integrasi Tombol Eksekusi Deploy Akhir (Step 6)
    document.getElementById("deployButton").addEventListener("click", executeDeployment);
}

// Synchronize Default Values From HTML
function syncFormToState() {
    state.formData.name = document.getElementById("tokenName").value || "";
    state.formData.symbol = document.getElementById("tokenSymbol").value || "";
    state.formData.supply = document.getElementById("tokenSupply").value || "1000000";
    state.formData.owner = document.getElementById("tokenOwner").value || "";
    updateLivePreview();
}

// =====================================================
// Logika Sinkronisasi UI, Live Preview, & Step 5 Review
// =====================================================
function updateLivePreview() {
    // Update Sidebar Preview
    document.getElementById("previewName").innerText = state.formData.name || "Token Name";
    document.getElementById("previewSymbol").innerText = state.formData.symbol || "SYMBOL";
    document.getElementById("previewSupply").innerText = state.formData.supply ? Number(state.formData.supply).toLocaleString() : "-";
    document.getElementById("previewOwner").innerText = state.formData.owner ? `${state.formData.owner.substring(0,6)}...${state.formData.owner.slice(-4)}` : "-";

    // Hitung jumlah fitur terpilih untuk ditampilkan
    const enabledFeaturesCount = Object.values(state.formData.features).filter(Boolean).length;
    document.getElementById("previewFeatures").innerText = `${enabledFeaturesCount} Enabled`;
    const featureSummaryCount = document.getElementById("enabledFeatureCount");
    if (featureSummaryCount) featureSummaryCount.innerText = enabledFeaturesCount;

    // Sinkronisasi Data Masuk ke Halaman Step 5 (Review Card)
    document.getElementById("reviewName").innerText = state.formData.name || "-";
    document.getElementById("reviewSymbol").innerText = state.formData.symbol || "-";
    document.getElementById("reviewSupply").innerText = state.formData.supply ? Number(state.formData.supply).toLocaleString() : "-";
    document.getElementById("reviewOwner").innerText = state.formData.owner || "-";
}

// =====================================================
// Navigasi Wizard Control
// =====================================================
function goToStep(stepNumber) {
    if (stepNumber < 1 || stepNumber > state.totalSteps) return;
    state.currentStep = stepNumber;
    updateUI();
}

function nextStep() {
    if (state.currentStep === 1 && !isConnected()) {
        showToast("Wallet Required", "Silakan koneksikan dompet kripto Anda terlebih dahulu.", "error");
        return;
    }
    if (state.currentStep === 2 && (!state.formData.name || !state.formData.symbol)) {
        showToast("Missing Info", "Nama token dan Simbol wajib diisi.", "warning");
        return;
    }
    if (state.currentStep === 5) {
        // Validasi kesepakatan lembar persetujuan di Step 5 sebelum buka Step 6
        if (!document.getElementById("confirmInformation").checked || 
            !document.getElementById("confirmOwnership").checked || 
            !document.getElementById("confirmIrreversible").checked) {
            showToast("Review Diperlukan", "Anda harus mencentang semua kotak persetujuan.", "warning");
            return;
        }
    }
    if (state.currentStep < state.totalSteps) {
        state.currentStep++;
        updateUI();
    }
}

function prevStep() {
    if (state.currentStep > 1) {
        state.currentStep--;
        updateUI();
    }
}

function updateUI() {
    // 1. Tampilkan section step yang aktif, sembunyikan sisanya
    document.querySelectorAll(".wizardStep").forEach(section => {
        const step = parseInt(section.getAttribute("data-step"));
        if (step === state.currentStep) {
            section.classList.add("activeStep");
        } else {
            section.classList.remove("activeStep");
        }
    });

    // 2. Perbarui State Visual Timeline Atas
    document.querySelectorAll(".timelineStep").forEach(btn => {
        const step = parseInt(btn.getAttribute("data-step"));
        if (step === state.currentStep) {
            btn.classList.add("active");
        } else if (step < state.currentStep) {
            btn.classList.add("completed");
            btn.classList.remove("active");
        } else {
            btn.classList.remove("active", "completed");
        }
    });

    // 3. Update Teks Judul Dinamis & Counter Navigasi Bawah
    const titles = [
        "Connect Wallet",
        "ERC20MAX Configuration",
        "ERC20MAX Features",
        "Branding & Metadata",
        "Review Configuration",
        "Deploy ERC20MAX"
    ];
    document.getElementById("wizardTitle").innerText = titles[state.currentStep - 1];
    document.getElementById("currentStepLabel").innerText = `STEP ${state.currentStep} OF ${state.totalSteps}`;
    document.getElementById("stepCounter").innerText = `${state.currentStep} / ${state.totalSteps}`;

    // 4. Manajemen Status Tombol Back/Next
    document.getElementById("backButton").disabled = (state.currentStep === 1);
    
    const nextBtn = document.getElementById("nextButton");
    if (state.currentStep === state.totalSteps) {
        nextBtn.style.display = "none";
    } else {
        nextBtn.style.display = "inline-flex";
    }

    // Refresh Lucide Icons bila ada perubahan struktur icon
    if (window.lucide) window.lucide.createIcons();
}

// =====================================================
// Logika Pemanggilan Wallet Terintegrasi
// =====================================================
async function handleWalletConnection() {
    try {
        writeConsole("Menghubungkan dompet Web3 Anda...");
        await connectWallet();
        
        // Asumsi data wallet diupdate di wallet.js, mari kita baca hasilnya
        document.getElementById("walletConnectionStatus").innerText = "Connected";
        document.getElementById("walletBadge").className = "badge success";
        document.getElementById("walletBadge").innerText = "Active";
        
        showToast("Connected", "Dompet berhasil tersambung!", "success");
        writeConsole("Dompet terhubung dengan sukses.");
        goToStep(2);
    } catch (err) {
        showToast("Connection Failed", err.message, "error");
        writeConsole(`Error koneksi wallet: ${err.message}`);
    }
}

// =====================================================
// Logika Eksekusi Deploy Akhir (Menyambung ke deploy.js)
// =====================================================
async function executeDeployment() {
    const consoleOutput = document.getElementById("deployConsoleOutput");
    const deployBtn = document.getElementById("deployButton");
    
    try {
        deployBtn.disabled = true;
        writeConsole("Memulai alur kompilasi payload Smart Contract...");

        // Memetakan struktur data form flat front-end ke struktur nested ERC20MaxTypes
        const tokenConfig = deployManager.buildTokenConfig({
            name: state.formData.name,
            symbol: state.formData.symbol,
            supply: state.formData.supply,
            decimals: parseInt(state.formData.decimals),
            owner: state.formData.owner || window.ethereum?.selectedAddress,
            features: state.formData.features // Dioper langsung sebagai map/struct
        });

        const metadataConfig = deployManager.buildMetadata({
            website: state.formData.metadata.website,
            telegram: state.formData.metadata.telegram,
            twitter: state.formData.metadata.twitter,
            logoURI: state.formData.metadata.logoURI || ""
        });

        writeConsole("Menunggu persetujuan transaksi/signature dari wallet...");
        updateDeployTimelineVisual(1); // Set visual step ke Signature

        // Jalankan fungsi inti deployToken dari deploy.js
        const result = await deployManager.deployToken(tokenConfig, metadataConfig);

        // Jika sukses, tangani data balikan
        updateDeployTimelineVisual(3); // Set visual ke Completed
        writeConsole(`Deployment sukses besar! Alamat Kontrak: ${result.tokenAddress}`);
        
        // Tampilkan Card Hasil Deploy
        const resultCard = document.getElementById("deployResult");
        resultCard.removeAttribute("hidden");
        document.getElementById("contractAddress").innerText = result.tokenAddress;
        document.getElementById("transactionHash").innerText = `${result.txHash.substring(0,10)}...`;
        document.getElementById("blockNumber").innerText = result.blockNumber || "Pending";

        showToast("Sukses!", "Token ERC20MAX Anda berhasil dideploy ke Blockchain!", "success");

    } catch (error) {
        writeConsole(`[ERROR DEPLOYMENT]: ${error.message || error}`);
        updateDeployTimelineVisual(-1); // reset or error state
        showToast("Gagal Deploy", error.message || "Terjadi kesalahan transaksi.", "error");
        deployBtn.disabled = false;
    }
}

// =====================================================
// Komponen Helper UI (Console Logger & Toast Notification)
// =====================================================
function writeConsole(message) {
    const consoleOutput = document.getElementById("deployConsoleOutput");
    if (consoleOutput) {
        const time = new Date().toLocaleTimeString();
        consoleOutput.innerHTML += `\n[${time}] ${message}`;
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }
}

function updateDeployTimelineVisual(stepIndex) {
    const timelineSteps = document.querySelectorAll("#deployTimeline .deployStep");
    timelineSteps.forEach((step, idx) => {
        if (idx === stepIndex) {
            step.classList.add("active");
        } else if (idx < stepIndex) {
            step.classList.add("completed");
            step.classList.remove("active");
        } else {
            step.classList.remove("active", "completed");
        }
    });
}

function showToast(title, message, type = "info") {
    const container = document.getElementById("toastContainer");
    const template = document.getElementById("toastTemplate");
    if (!container || !template) return;

    const clone = template.content.cloneNode(true);
    const toast = clone.querySelector(".toast");
    
    toast.querySelector("h4").innerText = title;
    toast.querySelector("p").innerText = message;
    toast.classList.add(`toast--${type}`);

    container.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 4000);
            }

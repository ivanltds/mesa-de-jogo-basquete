// src/audio/audio-playback-queue.js
import { LEGACY_CATALOG } from './audio-catalog.js';

export const AudioPlaybackQueue = {
    queue: [],
    currentItem: null,
    currentAudio: null,
    isPlaying: false,

    // Maintain legacy library for soundboard compatibility
    library: LEGACY_CATALOG,

    // Legacy method for compatibility - updated to support priority
    play(category, priority = 5) {
        const files = this.library[category];
        if (files) {
            const file = files[Math.floor(Math.random() * files.length)];
            this.addToQueue(category, file, priority);
        }
    },

    // Legacy method for compatibility
    playFile(filename) {
        for (const cat in this.library) {
            if (this.library[cat].includes(filename)) {
                this.addToQueue(cat, filename);
                break;
            }
        }
    },

    // Updated addToQueue to support priority
    addToQueue(category, file, priority = 5, assetId = null, sourceEventId = null) {
        const item = {
            id: crypto.randomUUID(),
            assetId,
            category,
            file,
            sourceEventId,
            priority,
            requestedAt: Date.now()
        };

        this.queue.push(item);
        
        // Sort by priority (higher first), then by request time
        this.queue.sort((a, b) => b.priority - a.priority || a.requestedAt - b.requestedAt);
        
        if (window.UIManager) window.UIManager.renderSoundQueue();
        
        if (!this.isPlaying) {
            this.processQueue();
        }
    },

    async processQueue() {
        if (this.queue.length === 0) {
            this.isPlaying = false;
            this.currentItem = null;
            this.currentAudio = null;
            if (window.UIManager) window.UIManager.renderSoundQueue();
            return;
        }

        this.isPlaying = true;
        this.currentItem = this.queue.shift();
        
        if (window.UIManager) window.UIManager.renderSoundQueue();

        this.currentAudio = new Audio(`/audios/${this.currentItem.file}`);
        
        const next = () => {
            if (this.currentAudio) {
                this.currentAudio.onended = null;
                this.currentAudio.pause();
                this.currentAudio = null;
            }
            this.currentItem = null;
            this.processQueue();
        };

        this.currentAudio.onended = next;

        try {
            await this.currentAudio.play();
        } catch (e) {
            console.warn("Falha ao tocar áudio, pulando...", e);
            next();
        }
    },

    skip() {
        if (this.currentAudio || this.queue.length > 0) {
            if (window.notify) window.notify("Áudio pulado");
            if (this.currentAudio) {
                this.currentAudio.onended = null;
                this.currentAudio.pause();
                this.currentAudio = null;
            }
            this.currentItem = null;
            this.processQueue();
        }
    },

    removeFromQueue(id) {
        this.queue = this.queue.filter(item => item.id !== id);
        if (window.UIManager) window.UIManager.renderSoundQueue();
    }
};

window.AudioPlaybackQueue = AudioPlaybackQueue;

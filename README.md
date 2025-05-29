# Anonymous Cell - 偽りの接続 (False Connection)

## 1. Application Overview

*   **Name:** Anonymous Cell - 偽りの接続
*   **Description:** An interactive cyber mystery game where players delve into complex cases using two distinct interfaces: a realistic **Smartphone (CellOS)** and a powerful **Terminal environment**. Unravel intricate plots by gathering digital evidence, solving puzzles, interacting with characters, and making critical choices that shape the narrative.
*   **Core Concept:** Players step into the shoes of an investigator equipped with a target's smartphone and access to a specialized terminal. The gameplay revolves around exploring both digital environments, correlating information found across them, and utilizing unique tools from each UI to crack the case. The narrative is central, with player actions directly influencing story progression and outcomes.

## 2. Core Gameplay Mechanics (High-Level)

### 2.1. Dual UI Interaction
The defining feature of "Anonymous Cell" is the seamless integration of two primary user interfaces:

*   **Smartphone UI (CellOS):**
    *   Simulates a modern smartphone operating system.
    *   Players can navigate apps like social media (FriendNet, Chirp), messaging (WhisperTalk), email (MailWise), photo galleries (SnapVault), web browser (WebStalker), contacts, calendar, notes, maps, and file explorer.
    *   Emphasis on social engineering, analyzing communication patterns, and discovering personal data.
    *   Features include lock screen puzzles, app-specific interactions, and notification system.

*   **Terminal UI (Linux-like Shell):**
    *   Provides a command-line interface for deeper technical investigation.
    *   Players can execute commands for file system navigation, file content analysis, decryption, network reconnaissance, data recovery, and basic malware analysis.
    *   Focuses on forensic analysis, code-breaking, and exploiting system vulnerabilities (within the game's narrative).

*   **Synergy:** Clues found in one UI often unlock paths or provide context for actions in the other. For example, a password found in a smartphone note might be used to decrypt a file in the terminal, or a suspicious IP address from a terminal log might be investigated further using the smartphone's web browser or map app.

### 2.2. Investigation & Evidence
*   **Multi-faceted Evidence:** Evidence can be texts, images, videos, logs, emails, social media posts, files, network data, etc., found across both UIs.
*   **Analysis:**
    *   Terminal: `analyze`, `cat`, `grep`, decryption commands, etc.
    *   Smartphone: Examining photo metadata, message timestamps, contact lists, social connections, browser history.
*   **Data Repository (Terminal-focused):** Collects and allows annotation of key evidence primarily discovered via terminal operations. Smartphone evidence is typically viewed within its respective app.

### 2.3. Puzzles & Challenges
*   **Cross-UI Puzzles:** Many puzzles will require information or actions from both UIs.
*   **Smartphone Puzzles:** Passcode/pattern locks, social engineering through messaging apps, identifying fake social media profiles, analyzing app data.
*   **Terminal Puzzles:** Decryption, password cracking (dictionary/brute-force simulation), log analysis, data recovery from corrupted/deleted files, simple malware behavior identification.

### 2.4. Character Interaction
*   **Smartphone Focus:** Primary interaction through messaging apps (WhisperTalk), social media DMs (FriendNet), and email (MailWise).
*   **Dynamic Responses:** NPCs react based on dialogue choices, submitted evidence (via smartphone), trust levels, and narrative flags.
*   **Trust & Ethics:** Player choices in communication and actions (e.g., leaking private data, using deceptive tactics) can affect trust with characters and an overall "Ethical Score," influencing dialogue options and story paths.

### 2.5. Narrative & Progression
*   **Branching Storylines:** Decisions made by the player, puzzles solved, evidence discovered, and ethical choices significantly impact the narrative flow and potential endings.
*   **Narrative Flags:** A system to track key events and player choices, gating content and triggering specific story sequences across both UIs.
*   **Time-Sensitive Events (Planned):** Certain scenarios may have time limits, adding urgency.
*   **Accusation System (Terminal-based):** Conclude investigations by accusing a suspect, leading to different outcomes based on gathered proof.

## 3. Player State & Persistence
*   **`PlayerStoryState`:** A comprehensive object tracking all aspects of the player's current game session, including terminal state, smartphone state (apps, data, lock status), discovered evidence, solved puzzles, narrative flags, character trust levels, ethical score, etc.
*   **`PlayerProfile`:** Stores player username and highest story completed.
*   **Persistence:** Game state is saved to the browser's `localStorage` (prefix `anonymousCellPlayerProfile_` and `anonymousCellStoryState_`).

## 4. Application Structure
*   **Main UI View:** The application will switch between displaying the full-screen Terminal UI (with its associated side panels like Data Repository) and the full-screen Smartphone UI.
*   **UI Switching:** A dedicated toggle mechanism will allow players to switch between the Terminal and Smartphone views.

## 5. Story Content Configuration (`StoryContentData`)
Each story is defined by a rich `StoryContentData` object, now expanded to include:
*   `initialSmartphoneState`: Defines the starting state of the target's smartphone, including OS version, installed apps, initial app data (contacts, messages, posts, photos, emails), lock status, and passcode.
*   Detailed definitions for smartphone contacts, social media profiles, email accounts, photo albums, browser bookmarks, web content, calendar events, and notes.
*   Definitions for social engineering scenarios, ethical choices, time-limit events, and in-game malware samples.
*   Existing fields for terminal file system, evidence, puzzles, characters, narrative scripts, and system messages are retained and expanded where necessary.

## 6. Debug Mode
*   Accessible via specific login credentials (`adminalpine` / `adminalpine`).
*   Bypasses `localStorage` and runs automated test sequences. (Note: Debug sequences will need significant updates to cover smartphone functionality).

This README provides an initial overview of "Anonymous Cell - 偽りの接続". As development progresses and features are implemented, this document will be updated.

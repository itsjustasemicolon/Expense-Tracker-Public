/*
 * Expense Tracker
 * Copyright (c) 2025 Soham
 * All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * ACADEMIC INTEGRITY NOTICE:
 * This project is intended for educational purposes and as a personal portfolio project.
 * If you are a student from JU (or more importantly my friend) please do not submit this code as your own coursework.
 * Plagiarism is a serious academic offense :D
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

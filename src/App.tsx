import { useState } from 'react'
import { Routes, Route } from "react-router-dom";

import Home from './Pages/Tracker'

function App() {
  
  return (
  
      <> 
      
      <Routes location={""}>
        <Route path="/" element={<Home />} />
       
     
      </Routes>
     
      
      </>
  )
}

export default App




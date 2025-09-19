import { useState } from 'react'
import './App.css'
import './styles.scss'
import FormGrid from './FormGrid'
import AdvancedFormBuilder from './AdvancedFormBuilder'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      {/* <FormGrid /> */}
      <AdvancedFormBuilder />
    </>
  )
}

export default App

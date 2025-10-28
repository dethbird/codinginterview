
import React, { useState } from 'react'

export default function FormWizard() {
  const [step, setStep] = useState(0)
  const [data, setData] = useState({ email:'', password:'', name:'', city:'' })
  // TODO: render steps, validate, next/back, submit
  return (
    <div>
      <div data-testid="step">{step}</div>
      <button disabled>Back</button>
      <button>Next</button>
    </div>
  )
}

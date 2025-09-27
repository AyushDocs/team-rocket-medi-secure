"use client"

import { useState } from "react"

const PatientForm = ({ walletAddress, onFormSubmit }) => {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    allergies: "",
    bloodGroup: "",
    image: null,
  })
  const [imagePreview, setImagePreview] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData((prev) => ({
        ...prev,
        image: file,
      }))

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  
const handleSubmit = async (e) => {
  e.preventDefault()
  setIsSubmitting(true)

  try {
    const submitData = new FormData()
    submitData.append('name', formData.name)
    submitData.append('age', formData.age)
    submitData.append('allergies', formData.allergies)
    submitData.append('bloodGroup', formData.bloodGroup)
    if (formData.image) {
      submitData.append('image', formData.image)
    }

    await onFormSubmit(submitData)
  } catch (error) {
    console.error('Form submission error:', error)
  } finally {
    setIsSubmitting(false)
  }
}

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

  return (
    <div className="min-h-screen bg-[#DFE7EB] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h1 className="text-3xl font-bold text-[#703FA1] mb-2 text-center">Complete Your Profile</h1>
          <p className="text-gray-600 text-center mb-8">Wallet Address: {walletAddress}</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Profile Picture</label>
              <div className="flex items-center space-x-4">
                <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                  {imagePreview ? (
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  )}
                </div>
                <div>
                  <input type="file" id="image" accept="image/*" onChange={handleImageChange} className="hidden" />
                  <label
                    htmlFor="image"
                    className="cursor-pointer bg-[#703FA1] text-white px-4 py-2 rounded-lg hover:bg-[#5a2f81] transition-colors"
                  >
                    Choose Photo
                  </label>
                </div>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#703FA1] focus:border-transparent outline-none transition-all"
                placeholder="Enter your full name"
              />
            </div>
            {/* Age */}
          <div className="space-y-2">
            <label htmlFor="age" className="block text-sm font-medium text-gray-700">
              Age *
            </label>
            <input
              type="number"
              id="age"
              name="age"
              value={formData.age}
              onChange={handleInputChange}
              required
              min="0"
              max="120"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#703FA1] focus:border-transparent outline-none transition-all"
              placeholder="Enter your age"
            />
          </div>

            {/* Blood Group */}
            <div className="space-y-2">
              <label htmlFor="bloodGroup" className="block text-sm font-medium text-gray-700">
                Blood Group *
              </label>
              <select
                id="bloodGroup"
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#703FA1] focus:border-transparent outline-none transition-all"
              >
                <option value="">Select your blood group</option>
                {bloodGroups.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </div>

            {/* Allergies */}
            <div className="space-y-2">
              <label htmlFor="allergies" className="block text-sm font-medium text-gray-700">
                Allergies
              </label>
              <textarea
                id="allergies"
                name="allergies"
                value={formData.allergies}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#703FA1] focus:border-transparent outline-none transition-all resize-none"
                placeholder="List any allergies or dietary restrictions (optional)"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#703FA1] text-white py-3 px-6 rounded-lg hover:bg-[#5a2f81] transition-colors font-medium text-lg disabled:bg-gray-400">
              {isSubmitting ? 'Saving...' : 'Save Patient Information'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default PatientForm
const uploadMilestoneDocument = async (milestoneIndex) => {
    if (!milestoneFile) {
        alert('Please select a file first')
        return
    }

    setUploadingMilestone(true)
    try {
        const formData = new FormData()
        formData.append('file', milestoneFile)

        const { data } = await api.post('/api/student/upload', formData)

        // Update milestone with file URL
        await api.post('/api/student/update-progress', {
            milestoneIndex,
            fileUrl: data.url,
            progress: progress.milestones[milestoneIndex].progress,
            status: progress.milestones[milestoneIndex].status,
            notes: progress.milestones[milestoneIndex].notes
        })

        setMilestoneFile(null)
        fetchData()
        alert('Document uploaded successfully! Waiting for teacher approval.')
    } catch (error) {
        console.error('Error uploading document:', error)
        alert('Error uploading document')
    } finally {
        setUploadingMilestone(false)
    }
}

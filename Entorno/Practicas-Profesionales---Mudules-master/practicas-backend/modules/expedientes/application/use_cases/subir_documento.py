class SubirDocumentoUseCase:

    def __init__(self, repository):
        self.repository = repository

    def execute(self, documento):
        return self.repository.crear(documento)

class SQLAlchemyRepository:
    def __init__(self, db, model, pk_name: str):
        self.db = db
        self.model = model
        self.pk_name = pk_name

    def listar(self):
        return self.db.query(self.model).all()

    def obtener_por_id(self, entity_id: int):
        return (
            self.db.query(self.model)
            .filter(getattr(self.model, self.pk_name) == entity_id)
            .first()
        )

    def crear(self, entity):
        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def actualizar(self, entity, cambios: dict):
        for campo, valor in cambios.items():
            setattr(entity, campo, valor)
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def eliminar(self, entity):
        self.db.delete(entity)
        self.db.commit()
        return entity

    def commit_refresh(self, entity):
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def commit(self):
        self.db.commit()

    def refresh(self, entity):
        self.db.refresh(entity)
        return entity

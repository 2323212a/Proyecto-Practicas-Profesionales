'''Crea de forma interactiva el primer administrador del sistema.

Uso desde la raíz del proyecto:
    cd backend
    .venv/bin/python scripts/crear_primer_admin.py
'''

from __future__ import annotations

import sys
from getpass import getpass
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from infrastructure.database.connection import SessionLocal  # noqa: E402
from infrastructure.security.password import generar_password_hash  # noqa: E402


ROL_ADMINISTRADOR = 'Administrador'
DOMINIO_INSTITUCIONAL = '@unach.mx'


def _leer_obligatorio(etiqueta: str) -> str:
    while True:
        valor = input(f'{etiqueta}: ').strip()
        if valor:
            return valor
        print('El valor es obligatorio.')


def _leer_correo() -> str:
    while True:
        correo = _leer_obligatorio('Correo institucional').lower()
        if correo.endswith(DOMINIO_INSTITUCIONAL) and correo.count('@') == 1 and correo != DOMINIO_INSTITUCIONAL:
            return correo
        print(f'El correo debe pertenecer al dominio {DOMINIO_INSTITUCIONAL}.')


def _password_valido(password: str) -> tuple[bool, str]:
    if len(password) < 12:
        return False, 'La contraseña debe tener al menos 12 caracteres.'
    if len(password.encode('utf-8')) > 72:
        return False, 'La contraseña no puede superar 72 bytes.'
    if not any(caracter.islower() for caracter in password):
        return False, 'Incluye al menos una letra minúscula.'
    if not any(caracter.isupper() for caracter in password):
        return False, 'Incluye al menos una letra mayúscula.'
    if not any(caracter.isdigit() for caracter in password):
        return False, 'Incluye al menos un número.'
    if not any(not caracter.isalnum() for caracter in password):
        return False, 'Incluye al menos un carácter especial.'
    return True, ''


def _leer_password() -> str:
    while True:
        password = getpass('Contraseña del administrador: ')
        valido, mensaje = _password_valido(password)
        if not valido:
            print(mensaje)
            continue
        confirmacion = getpass('Confirmar contraseña: ')
        if password != confirmacion:
            print('Las contraseñas no coinciden.')
            continue
        return password


def main() -> int:
    db = SessionLocal()
    try:
        rol = db.execute(
            text(
                '''
                SELECT id_rol, activo
                FROM rol
                WHERE nombre = :nombre
                LIMIT 1
                '''
            ),
            {'nombre': ROL_ADMINISTRADOR},
        ).mappings().first()
        if rol is None:
            print(
                'No existe el rol Administrador. Primero carga los roles iniciales de la base de datos.',
                file=sys.stderr,
            )
            return 1
        if not bool(rol['activo']):
            print('El rol Administrador está inactivo.', file=sys.stderr)
            return 1

        administradores_activos = db.execute(
            text(
                '''
                SELECT COUNT(*)
                FROM usuario AS u
                INNER JOIN rol AS r ON r.id_rol = u.id_rol
                WHERE r.nombre = :nombre AND u.estado = 'Activo'
                '''
            ),
            {'nombre': ROL_ADMINISTRADOR},
        ).scalar_one()
        if administradores_activos:
            print(
                'Ya existe al menos un administrador activo. Usa el módulo Administración > Usuarios.',
                file=sys.stderr,
            )
            return 2

        print('Creación del primer administrador')
        print('La contraseña se solicitará de forma oculta y no se mostrará en pantalla.')
        correo = _leer_correo()
        nombre = _leer_obligatorio('Nombre')
        apellido_paterno = _leer_obligatorio('Apellido paterno')
        apellido_materno = input('Apellido materno (opcional): ').strip() or None
        departamento = input('Departamento (opcional): ').strip() or None
        cargo = input('Cargo (opcional): ').strip() or 'Administrador del sistema'
        telefono = input('Teléfono (opcional): ').strip() or None
        password = _leer_password()

        correo_existente = db.execute(
            text('SELECT COUNT(*) FROM usuario WHERE LOWER(correo) = :correo'),
            {'correo': correo},
        ).scalar_one()
        if correo_existente:
            print('Ya existe un usuario con ese correo.', file=sys.stderr)
            return 1

        resultado = db.execute(
            text(
                '''
                INSERT INTO usuario
                    (correo, password_hash, id_rol, estado, debe_cambiar_password)
                VALUES
                    (:correo, :password_hash, :id_rol, 'Activo', 0)
                '''
            ),
            {
                'correo': correo,
                'password_hash': generar_password_hash(password),
                'id_rol': rol['id_rol'],
            },
        )
        id_usuario = int(resultado.lastrowid)
        db.execute(
            text(
                '''
                INSERT INTO personal_interno
                    (id_usuario, nombre, apellido_paterno, apellido_materno, departamento, cargo, telefono)
                VALUES
                    (:id_usuario, :nombre, :apellido_paterno, :apellido_materno, :departamento, :cargo, :telefono)
                '''
            ),
            {
                'id_usuario': id_usuario,
                'nombre': nombre,
                'apellido_paterno': apellido_paterno,
                'apellido_materno': apellido_materno,
                'departamento': departamento,
                'cargo': cargo,
                'telefono': telefono,
            },
        )
        db.commit()
        print('Primer administrador creado correctamente.')
        print(f'Correo de acceso: {correo}')
        print('Ya puedes iniciar sesión con la contraseña registrada.')
        return 0
    except (KeyboardInterrupt, EOFError):
        db.rollback()
        print('\nOperación cancelada. No se realizaron cambios.', file=sys.stderr)
        return 130
    except SQLAlchemyError as exc:
        db.rollback()
        print(f'No se pudo crear el administrador: {exc}', file=sys.stderr)
        return 1
    finally:
        db.close()


if __name__ == '__main__':
    raise SystemExit(main())
